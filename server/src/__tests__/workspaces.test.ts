import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import User from '../models/User';
import Workspace from '../models/Workspace';
import Task from '../models/Task';

let token: string;
let userId: string;

/**
 * Create a verified user directly in the DB and return a JWT.
 */
async function createVerifiedUser(name: string, email: string) {
  await request(app)
    .post('/api/auth/signup')
    .send({ name, email, password: 'Password1!' });

  await User.updateOne({ email }, { isVerified: true });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password1!' });

  return {
    token: loginRes.body.token,
    userId: loginRes.body.user.id,
  };
}

describe('Workspace Endpoints', () => {
  beforeEach(async () => {
    const user = await createVerifiedUser('Workspace User', 'wsuser@example.com');
    token = user.token;
    userId = user.userId;
  });

  describe('POST /api/workspaces/demo', () => {
    it('should create a demo workspace with tasks', async () => {
      const res = await request(app)
        .post('/api/workspaces/demo')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.name).toContain('Hire Arnav');
      
      const workspaceId = res.body._id;
      const tasks = await Task.find({ workspaceId });
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].title).toBeDefined();
    });
  });

  describe('POST /api/workspaces', () => {
    it('should create a new workspace', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'My New Workspace' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('My New Workspace');
      expect(res.body.owner).toBe(userId);
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/workspaces', () => {
    it('should list user workspaces', async () => {
      await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'WS 1' });

      const res = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].name).toBe('WS 1');
    });
  });

  describe('PUT /api/workspaces/:id', () => {
    it('should rename a workspace', async () => {
      const createRes = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Old Name' });
      
      const id = createRes.body._id;

      const res = await request(app)
        .put(`/api/workspaces/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('New Name');
    });

    it('should return 404 for non-existent workspace', async () => {
      const res = await request(app)
        .put('/api/workspaces/aaaaaaaaaaaaaaaaaaaaaaaa')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/workspaces/:id', () => {
    it('should delete a workspace and its tasks', async () => {
      const createRes = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete' });
      
      const id = createRes.body._id;

      // Add a task to it
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task in WS', workspaceId: id });

      const res = await request(app)
        .delete(`/api/workspaces/${id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);

      // Verify workspace is gone
      const checkRes = await request(app)
        .get(`/api/workspaces/${id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(checkRes.status).toBe(404);

      // Verify tasks are gone
      const tasks = await Task.find({ workspaceId: id });
      expect(tasks).toHaveLength(0);
    });
  });
});
