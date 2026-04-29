import { Router } from 'express';
import Workspace from '../models/Workspace';
import { authMiddleware, AuthRequest } from '../middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { validate, z } from '../middleware/validate';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(async (req: AuthRequest, res) => {
  const workspaces = await Workspace.findAll({ where: { ownerId: req.user!.id }, order: [['createdAt', 'DESC']] });
  res.json(workspaces);
}));

router.post('/', validate(z.object({ name: z.string().min(1) })), asyncHandler(async (req: AuthRequest, res) => {
  const workspace = await Workspace.create({ name: req.body.name, ownerId: req.user!.id });
  res.status(201).json(workspace);
}));

export default router;
