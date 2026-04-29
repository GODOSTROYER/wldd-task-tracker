import request from 'supertest';
import app from '../app';
import User from '../models/User';
import Workspace from '../models/Workspace';
import Task from '../models/Task';

async function createVerifiedUser(email: string) {
  await request(app)
    .post('/api/auth/signup')
    .send({ name: email.split('@')[0], email, password: 'Password1!' });

  const user = await User.findOne({ where: { email } });
  const verify = await request(app)
    .post('/api/auth/verify-email')
    .send({ email, otp: user!.verificationOtp });

  await Task.destroy({ where: { ownerId: verify.body.user.id } });
  const workspace = await Workspace.create({ name: 'Test Workspace', ownerId: verify.body.user.id });

  return { token: verify.body.token, userId: verify.body.user.id, workspaceId: workspace.id };
}

describe('Task Endpoints', () => {
  it('creates a task with Kanban metadata', async () => {
    const user = await createVerifiedUser('task@example.com');

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        title: 'My Task',
        description: 'Do something',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2026-05-10',
        workspaceId: user.workspaceId,
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.ownerId).toBe(user.userId);
    expect(res.body.workspaceId).toBe(user.workspaceId);
    expect(res.body.status).toBe('in-progress');
    expect(res.body.priority).toBe('high');
  });

  it('validates create input and requires auth', async () => {
    const user = await createVerifiedUser('validation@example.com');

    const missingTitle = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ workspaceId: user.workspaceId });
    expect(missingTitle.status).toBe(400);

    const noAuth = await request(app)
      .post('/api/tasks')
      .send({ title: 'No Auth', workspaceId: user.workspaceId });
    expect(noAuth.status).toBe(401);
  });

  it('lists only the authenticated user tasks and filters by workspace', async () => {
    const user = await createVerifiedUser('owner@example.com');
    const other = await createVerifiedUser('other@example.com');

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Task 1', workspaceId: user.workspaceId });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Task 2', workspaceId: user.workspaceId });
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Other Task', workspaceId: other.workspaceId });

    const res = await request(app)
      .get(`/api/tasks?workspaceId=${user.workspaceId}`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.map((task: any) => task.title)).toEqual(['Task 1', 'Task 2']);
  });

  it('updates, batch-reorders, and deletes owned tasks only', async () => {
    const user = await createVerifiedUser('crud@example.com');
    const other = await createVerifiedUser('crud-other@example.com');

    const first = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'First', workspaceId: user.workspaceId });
    const second = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Second', workspaceId: user.workspaceId });

    const blocked = await request(app)
      .put(`/api/tasks/${first.body.id}`)
      .set('Authorization', `Bearer ${other.token}`)
      .send({ title: 'Stolen' });
    expect(blocked.status).toBe(404);

    const updated = await request(app)
      .put(`/api/tasks/${first.body.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Updated', status: 'completed', dueDate: null });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('completed');

    const batch = await request(app)
      .put('/api/tasks/batch')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        tasks: [
          { id: first.body.id, status: 'completed', position: 2048 },
          { id: second.body.id, status: 'todo', position: 1024 },
        ],
      });
    expect(batch.status).toBe(200);

    const deleted = await request(app)
      .delete(`/api/tasks/${second.body.id}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(deleted.status).toBe(200);

    const remaining = await request(app)
      .get(`/api/tasks?workspaceId=${user.workspaceId}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(remaining.body).toHaveLength(1);
    expect(remaining.body[0].title).toBe('Updated');
  });

  it('does not allow tasks in another user workspace', async () => {
    const user = await createVerifiedUser('creator@example.com');
    const other = await createVerifiedUser('workspace-owner@example.com');

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Cross-user task', workspaceId: other.workspaceId });

    expect(res.status).toBe(404);
  });
});
