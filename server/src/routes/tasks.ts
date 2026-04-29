import { Router } from 'express';
import { batchUpdateTasks, createTask, deleteTask, getTasks, updateTask } from '../controllers/taskController';
import { authMiddleware } from '../middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { validate, z } from '../middleware/validate';

const router = Router();
router.use(authMiddleware);

const statusSchema = z.enum(['todo', 'in-progress', 'in-review', 'completed']);
const prioritySchema = z.enum(['low', 'medium', 'high']);
const dueDateSchema = z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.null()]);

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  status: statusSchema.optional().default('todo'),
  priority: prioritySchema.optional().default('medium'),
  dueDate: dueDateSchema.optional(),
  position: z.number().int().nonnegative().optional(),
  workspaceId: z.string().uuid(),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: statusSchema.optional(),
  priority: prioritySchema.optional(),
  dueDate: dueDateSchema.optional(),
  position: z.number().int().nonnegative().optional(),
  workspaceId: z.string().uuid().optional(),
});

const batchSchema = z.object({
  tasks: z.array(z.object({
    id: z.string().uuid(),
    status: statusSchema,
    position: z.number().int().nonnegative(),
  })).min(1),
});

router.get('/', asyncHandler(getTasks));
router.post('/', validate(createSchema), asyncHandler(createTask));
router.put('/batch', validate(batchSchema), asyncHandler(batchUpdateTasks));
router.put('/:id', validate(updateSchema), asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

export default router;
