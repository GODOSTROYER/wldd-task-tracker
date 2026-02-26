import request from 'supertest';
import app from '../app';
import User from '../models/User';
import Workspace from '../models/Workspace';

let token: string;
let workspaceId: string;

async function createVerifiedUser() {
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Cache User', email: 'cacheuser@example.com', password: 'Password1!' });

  await User.updateOne({ email: 'cacheuser@example.com' }, { isVerified: true });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'cacheuser@example.com', password: 'Password1!' });

  const userId = loginRes.body.user.id;
  const userToken = loginRes.body.token;

  const workspace = await Workspace.create({
    name: 'Cache Test Workspace',
    owner: userId,
    members: [userId],
  });

  return { token: userToken, workspaceId: workspace._id.toString() };
}

describe('Redis Caching', () => {
  beforeEach(async () => {
    const user = await createVerifiedUser();
    token = user.token;
    workspaceId = user.workspaceId;
  });

  it('should cache GET /api/tasks result', async () => {
    // Create a task
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Cached Task', workspaceId });

    // First GET — should fetch from DB and cache
    const res1 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res1.status).toBe(200);
    expect(res1.body).toHaveLength(1);

    // Second GET — should hit cache (same result)
    const res2 = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res2.status).toBe(200);
    expect(res2.body).toHaveLength(1);
    expect(res2.body[0].title).toBe('Cached Task');
  });

  it('should invalidate cache on POST (create task)', async () => {
    // Populate cache
    await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    // Create a new task — should invalidate cache
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Task' });

    // GET should return fresh data (including the new task)
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('New Task');
  });

  it('should invalidate cache on PUT (update task)', async () => {
    // Create and cache
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Before Update' });
    const taskId = createRes.body._id;

    await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    // Update task — should invalidate cache
    await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'After Update' });

    // GET should return fresh data
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body[0].title).toBe('After Update');
  });

  it('should invalidate cache on DELETE', async () => {
    // Create and cache
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Be Deleted' });
    const taskId = createRes.body._id;

    await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    // Delete — should invalidate cache
    await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`);

    // GET should return empty
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(res.body).toHaveLength(0);
  });
});
