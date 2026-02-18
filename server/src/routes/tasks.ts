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
  status: z.enum(['pending', 'completed']).optional().default('pending'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
});

// GET /api/tasks — list tasks for logged-in user
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Check Redis cache first
    const cached = await getCachedTasks(userId);
    if (cached) {
      res.status(200).json(JSON.parse(cached));
      return;
    }

    const tasks = await Task.find({ owner: userId }).sort({ createdAt: -1 });

    // Cache the result
    await setCachedTasks(userId, JSON.stringify(tasks));

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tasks — create task
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;
    const { title, description, status, dueDate } = parsed.data;

    const task = await Task.create({
      title,
      description,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      owner: userId,
    });

    // Invalidate cache
    await invalidateCache(userId);

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tasks/:id — update task
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (task.owner.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to update this task' });
      return;
    }

    const { title, description, status, dueDate } = parsed.data;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;

    await task.save();

    // Invalidate cache
    await invalidateCache(userId);

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tasks/:id — delete task
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    if (task.owner.toString() !== userId) {
      res.status(403).json({ message: 'Not authorized to delete this task' });
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
