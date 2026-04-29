import { fn, col } from 'sequelize';
import Task, { TaskStatus } from '../models/Task';
import Workspace from '../models/Workspace';
import { AuthRequest } from '../middleware';
import { AppError } from '../middleware/errorHandler';
import { sequelize } from '../config';

async function ensureWorkspace(ownerId: string, workspaceId: string): Promise<Workspace> {
  const workspace = await Workspace.findOne({ where: { id: workspaceId, ownerId } });
  if (!workspace) throw new AppError('Workspace not found', 404);
  return workspace;
}

async function nextPosition(ownerId: string, workspaceId: string, status: TaskStatus): Promise<number> {
  const row = await Task.findOne({
    where: { ownerId, workspaceId, status },
    attributes: [[fn('MAX', col('position')), 'maxPosition']],
    raw: true,
  }) as { maxPosition: number | null } | null;

  return Number(row?.maxPosition || 0) + 1024;
}

export async function getTasks(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId : undefined;
  const where = workspaceId ? { ownerId: userId, workspaceId } : { ownerId: userId };

  if (workspaceId) await ensureWorkspace(userId, workspaceId);

  const tasks = await Task.findAll({
    where,
    order: [['status', 'ASC'], ['position', 'ASC'], ['createdAt', 'ASC']],
  });

  res.json(tasks);
}

export async function createTask(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  await ensureWorkspace(userId, req.body.workspaceId);

  const status = req.body.status as TaskStatus;
  const task = await Task.create({
    title: req.body.title,
    description: req.body.description,
    status,
    priority: req.body.priority,
    dueDate: req.body.dueDate ?? null,
    position: req.body.position ?? await nextPosition(userId, req.body.workspaceId, status),
    ownerId: userId,
    workspaceId: req.body.workspaceId,
  });

  res.status(201).json(task);
}

export async function updateTask(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const task = await Task.findOne({ where: { id: req.params.id, ownerId: userId } });
  if (!task) throw new AppError('Task not found', 404);

  if (req.body.workspaceId && req.body.workspaceId !== task.workspaceId) {
    await ensureWorkspace(userId, req.body.workspaceId);
  }

  await task.update(req.body);
  res.json(task);
}

export async function batchUpdateTasks(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const updates = req.body.tasks as Array<{ id: string; status: TaskStatus; position: number }>;

  await sequelize.transaction(async (transaction) => {
    for (const update of updates) {
      const [count] = await Task.update(
        { status: update.status, position: update.position },
        { where: { id: update.id, ownerId: userId }, transaction },
      );
      if (!count) throw new AppError('Task not found', 404);
    }
  });

  res.json({ message: 'Tasks updated' });
}

export async function deleteTask(req: AuthRequest, res: any) {
  const userId = req.user!.id;
  const deleted = await Task.destroy({ where: { id: req.params.id, ownerId: userId } });
  if (!deleted) throw new AppError('Task not found', 404);
  res.json({ message: 'Task deleted' });
}
