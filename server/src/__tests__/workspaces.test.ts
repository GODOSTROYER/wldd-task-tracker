import request from 'supertest';
import app from '../app';
import User from '../models/User';
import Task from '../models/Task';

async function createVerifiedUser(email: string) {
  await request(app)
    .post('/api/auth/signup')
    .send({ name: email.split('@')[0], email, password: 'Password1!' });

  const user = await User.findOne({ where: { email } });
  const verify = await request(app)
    .post('/api/auth/verify-email')
    .send({ email, otp: user!.verificationOtp });

  return { token: verify.body.token, userId: verify.body.user.id };
}

describe('Workspace Endpoints', () => {
  it('lists the default workspace created on verification', async () => {
    const user = await createVerifiedUser('list@example.com');

    const res = await request(app)
      .get('/api/workspaces')
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Getting Started');
    expect(res.body[0].ownerId).toBe(user.userId);
  });

  it('creates, reads, and renames an owned workspace', async () => {
    const user = await createVerifiedUser('workspace@example.com');

    const create = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'My Workspace' });
    expect(create.status).toBe(201);
    expect(create.body.ownerId).toBe(user.userId);

    const read = await request(app)
      .get(`/api/workspaces/${create.body.id}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(read.status).toBe(200);
    expect(read.body.name).toBe('My Workspace');

    const rename = await request(app)
      .put(`/api/workspaces/${create.body.id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'Renamed Workspace' });
    expect(rename.status).toBe(200);
    expect(rename.body.name).toBe('Renamed Workspace');
  });

  it('creates demo workspace with tasks', async () => {
    const user = await createVerifiedUser('demo@example.com');

    const res = await request(app)
      .post('/api/workspaces/demo')
      .set('Authorization', `Bearer ${user.token}`);

    expect(res.status).toBe(201);
    const tasks = await Task.findAll({ where: { workspaceId: res.body.id, ownerId: user.userId } });
    expect(tasks.length).toBeGreaterThan(0);
  });

  it('prevents cross-user access and deletes workspace tasks', async () => {
    const user = await createVerifiedUser('delete@example.com');
    const other = await createVerifiedUser('other-delete@example.com');

    const create = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'To Delete' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Task in workspace', workspaceId: create.body.id });

    const blocked = await request(app)
      .get(`/api/workspaces/${create.body.id}`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(blocked.status).toBe(404);

    const deleted = await request(app)
      .delete(`/api/workspaces/${create.body.id}`)
      .set('Authorization', `Bearer ${user.token}`);
    expect(deleted.status).toBe(200);

    const tasks = await Task.findAll({ where: { workspaceId: create.body.id } });
    expect(tasks).toHaveLength(0);
  });
});
