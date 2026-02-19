import { Router, Response } from 'express';
import { z } from 'zod';
import Task from '../models/Task';
import authMiddleware, { AuthRequest } from '../middleware/auth';
import { getCachedTasks, setCachedTasks, invalidateCache } from '../middleware/cache';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  status: z.enum(['todo', 'in-progress', 'in-review', 'completed']).optional().default('todo'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  color: z.string().optional().nullable(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'in-review', 'completed']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  color: z.string().optional().nullable(),
});

// GET /api/tasks — list tasks for logged-in user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.query;

    // Check Redis cache first
    // Check Redis cache first (only if no specific workspace filter for now to keep it simple, or key by workspace)
    // For now, let's bypass cache if workspaceId is present to avoid complexity
    if (!workspaceId) {
        const cached = await getCachedTasks(userId);
        if (cached) {
          res.status(200).json(JSON.parse(cached));
          return;
        }
    }

    const query: any = { owner: userId };
    
    // If workspaceId is provided, filter by it.
    // If not, maybe return all? Or return none? 
    // User asked to organize by workspace. Let's require it or return empty if not provided for now, 
    // but better to allow filtering.
    if (workspaceId) {
       query.workspaceId = workspaceId;
    }

    const tasks = await Task.find(query).sort({ position: 1, createdAt: -1 });

    // Cache the result
    // (Optional: update cache implementation to handle workspace-specific caching later)
    
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/batch - Batch update tasks (for reordering)
router.put('/batch', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body; // Expect array of { _id, status, position }
    if (!Array.isArray(tasks)) {
      res.status(400).json({ message: 'Tasks must be an array' });
      return;
    }

    const userId = req.user!.id;
    
    // Use bulkWrite for efficiency
    const operations = tasks.map((task: any) => ({
      updateOne: {
        filter: { _id: task._id, owner: userId },
        update: { 
          $set: { 
            status: task.status, 
            position: task.position 
          } 
        }
      }
    }));

    if (operations.length > 0) {
      await Task.bulkWrite(operations);
    }

    // Invalidate cache since multiple tasks changed
    await invalidateCache(userId);

    res.status(200).json({ message: 'Tasks updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks - Create a new task
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const parsed = createTaskSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
      }
  
      const userId = req.user!.id;

      // Get max position for new task to append it
      const maxPosTask = await Task.findOne({ 
          owner: userId, 
          workspaceId: parsed.data.workspaceId, 
          status: parsed.data.status 
      }).sort({ position: -1 });
      
      const position = maxPosTask ? maxPosTask.position + 1024 : 1024; // Spacing for safe reordering

      const task = new Task({
        ...parsed.data,
        owner: userId,
        position,
      });
  
      await task.save();
      await invalidateCache(userId);
  
      res.status(201).json(task);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;
    const task = await Task.findOne({ _id: req.params.id, owner: userId });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    Object.assign(task, parsed.data);
    await task.save();
    await invalidateCache(userId);

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id - Delete a task
// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const task = await Task.findOne({ _id: req.params.id, owner: userId });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await task.deleteOne();

    // Invalidate cache
    await invalidateCache(userId);

    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
