import { Response, Router } from 'express';
import Workspace from '../models/Workspace';
import Task from '../models/Task';
import { authMiddleware, AuthRequest } from '../middleware';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { validate, z } from '../middleware/validate';

const router = Router();
router.use(authMiddleware);

const nameSchema = z.object({ name: z.string().min(1) });

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspaces = await Workspace.findAll({
    where: { ownerId: req.user!.id },
    order: [['createdAt', 'DESC']],
  });
  res.json(workspaces);
}));

router.post('/demo', asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const workspace = await Workspace.create({ name: 'Getting Started', ownerId: userId });
  await Task.bulkCreate([
    {
      title: 'Plan your first sprint',
      description: 'Capture a few tasks, then drag them through the board.',
      status: 'todo',
      priority: 'high',
      position: 1024,
      ownerId: userId,
      workspaceId: workspace.id,
    },
    {
      title: 'Review the task workflow',
      description: 'Try due dates, priorities, and status changes.',
      status: 'in-review',
      priority: 'medium',
      position: 2048,
      ownerId: userId,
      workspaceId: workspace.id,
    },
  ]);
  res.status(201).json(workspace);
}));

router.post('/', validate(nameSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspace = await Workspace.create({ name: req.body.name, ownerId: req.user!.id });
  res.status(201).json(workspace);
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspace = await Workspace.findOne({ where: { id: req.params.id, ownerId: req.user!.id } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  res.json(workspace);
}));

router.put('/:id', validate(nameSchema), asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspace = await Workspace.findOne({ where: { id: req.params.id, ownerId: req.user!.id } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  workspace.name = req.body.name;
  await workspace.save();
  res.json(workspace);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const workspace = await Workspace.findOne({ where: { id: req.params.id, ownerId: req.user!.id } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  await Task.destroy({ where: { workspaceId: workspace.id, ownerId: req.user!.id } });
  await workspace.destroy();
  res.json({ message: 'Workspace deleted' });
}));

export default router;
