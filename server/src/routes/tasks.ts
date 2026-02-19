/**
 * @file routes/tasks.ts — Task CRUD and batch update API
 *
 * All routes require JWT authentication (via authMiddleware).
 * Tasks are scoped to the authenticated user (owner) and optionally a workspace.
 *
 * Endpoints:
 *   GET    /           — List tasks (optionally filtered by workspaceId)
 *   PUT    /batch      — Batch update status/position (for drag-and-drop reordering)
 *   POST   /           — Create a new task
 *   PUT    /:id        — Update a single task
 *   DELETE /:id        — Delete a single task
 *
 * Redis caching is used for GET requests without a workspace filter.
 * Cache is invalidated on every write operation (POST, PUT, DELETE, batch).
 */

import { Router, Response } from 'express';
import { z } from 'zod';
import Task from '../models/Task';
import authMiddleware, { AuthRequest } from '../middleware';
import { getCachedTasks, setCachedTasks, invalidateCache } from '../middleware';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

// ─── Validation Schemas ───────────────────────────────────────────────────────

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''),
  status: z.enum(['todo', 'in-progress', 'in-review', 'completed']).optional().default('todo'),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  color: z.string().optional().nullable(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'in-review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable()),
  color: z.string().optional().nullable(),
});

// ─── GET / — List tasks ───────────────────────────────────────────────────────

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.query;

    // Use Redis cache when listing all tasks (no workspace filter)
    if (!workspaceId) {
      const cached = await getCachedTasks(userId);
      if (cached) {
        res.status(200).json(JSON.parse(cached));
        return;
      }
    }

    const query: any = { owner: userId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const tasks = await Task.find(query).sort({ position: 1, createdAt: -1 });

    // Cache the result when no workspace filter is applied
    if (!workspaceId) {
      await setCachedTasks(userId, JSON.stringify(tasks));
    }

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PUT /batch — Batch update (drag-and-drop reordering) ─────────────────────

router.put('/batch', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks)) {
      res.status(400).json({ message: 'Tasks must be an array' });
      return;
    }

    const userId = req.user!.id;

    // Use bulkWrite for efficient batch updates
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

    await invalidateCache(userId);
    res.status(200).json({ message: 'Tasks updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST / — Create a new task ───────────────────────────────────────────────

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;

    // Calculate position: append after the last task in the same column
    const maxPosTask = await Task.findOne({
      owner: userId,
      workspaceId: parsed.data.workspaceId,
      status: parsed.data.status
    }).sort({ position: -1 });

    const position = maxPosTask ? maxPosTask.position + 1024 : 1024;

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

// ─── PUT /:id — Update a single task ──────────────────────────────────────────

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

// ─── DELETE /:id — Delete a single task ───────────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const task = await Task.findOne({ _id: req.params.id, owner: userId });

    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await task.deleteOne();
    await invalidateCache(userId);

    res.status(200).json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
