import { Router } from 'express';
import { createTask, deleteTask, getTasks, updateTask } from '../controllers/taskController';
import { authMiddleware } from '../middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { validate, z } from '../middleware/validate';

const router = Router();
router.use(authMiddleware);

const createSchema = z.object({ title: z.string().min(1), description: z.string().optional().default(''), status: z.enum(['pending', 'completed']).optional().default('pending'), workspaceId: z.string().uuid() });
const updateSchema = z.object({ title: z.string().min(1).optional(), description: z.string().optional(), status: z.enum(['pending', 'completed']).optional() });

router.get('/', asyncHandler(getTasks));
router.post('/', validate(createSchema), asyncHandler(createTask));
router.put('/:id', validate(updateSchema), asyncHandler(updateTask));
router.delete('/:id', asyncHandler(deleteTask));

export default router;
