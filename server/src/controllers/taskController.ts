import Task from '../models/Task';
import { AuthRequest, getCachedTasks, invalidateCache, setCachedTasks } from '../middleware';
import { AppError } from '../middleware/errorHandler';

export async function getTasks(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const cached = await getCachedTasks(userId);
  if (cached) return res.json(JSON.parse(cached));
  const tasks = await Task.findAll({ where: { ownerId: userId }, order: [['createdAt', 'DESC']] });
  await setCachedTasks(userId, JSON.stringify(tasks));
  res.json(tasks);
}

export async function createTask(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const task = await Task.create({ ...req.body, ownerId: userId });
  await invalidateCache(userId);
  res.status(201).json(task);
}

export async function updateTask(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const task = await Task.findOne({ where: { id: req.params.id, ownerId: userId } });
  if (!task) throw new AppError('Task not found', 404);
  await task.update(req.body);
  await invalidateCache(userId);
  res.json(task);
}

export async function deleteTask(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const deleted = await Task.destroy({ where: { id: req.params.id, ownerId: userId } });
  if (!deleted) throw new AppError('Task not found', 404);
  await invalidateCache(userId);
  res.json({ message: 'Task deleted' });
}
