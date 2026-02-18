import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app';
import User from '../models/User';

let token: string;
let userId: string;

let otherToken: string;

/**
 * Create a verified user directly in the DB and return a JWT.
 * This bypasses the OTP email flow, which is tested separately in auth.test.ts.
 */
async function createVerifiedUser(name: string, email: string, password: string) {
  // Sign up through the API (creates user + OTP)
  await request(app)
    .post('/api/auth/signup')
    .send({ name, email, password });

  // Mark as verified directly in DB
  await User.updateOne({ email }, { isVerified: true });

  // Login to get a token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return {
    token: loginRes.body.token,
    userId: loginRes.body.user.id,
  };
}

describe('Task Endpoints', () => {
  beforeEach(async () => {
    const user = await createVerifiedUser('Task User', 'taskuser@example.com', 'Password1!');
    token = user.token;
    userId = user.userId;

    const other = await createVerifiedUser('Other User', 'other@example.com', 'Password1!');
    otherToken = other.token;
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'My Task', description: 'Do something' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('My Task');
      expect(res.body.description).toBe('Do something');
      expect(res.body.status).toBe('pending');
      expect(res.body.owner).toBe(userId);
    });

    it('should return 400 for missing title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({ title: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 1' });
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 2' });
      // Other user's task
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Other Task' });
    });

    it('should list only the logged-in user tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Task 2'); // sorted by createdAt desc
      expect(res.body[1].title).toBe('Task 1');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Update Me' });
      taskId = res.body._id;
    });

    it('should update own task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'completed', title: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
      expect(res.body.title).toBe('Updated');
    });

    it('should return 403 when updating another user task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent task', async () => {
      const res = await request(app)
        .put('/api/tasks/aaaaaaaaaaaaaaaaaaaaaaaa')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Delete Me' });
      taskId = res.body._id;
    });

    it('should delete own task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Task deleted');

      // Verify it's gone
      const list = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);
      expect(list.body).toHaveLength(0);
    });

    it('should return 403 when deleting another user task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 when deleting non-existent task', async () => {
      const res = await request(app)
        .delete('/api/tasks/aaaaaaaaaaaaaaaaaaaaaaaa')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Edge cases', () => {
    it('should create a task with dueDate', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Due Task', dueDate: '2025-12-31' });

      expect(res.status).toBe(201);
      expect(res.body.dueDate).toBeDefined();
    });

    it('should create a task with completed status', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Completed Task', status: 'completed' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('completed');
    });

    it('should return 400 for invalid status in update', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test' });

      const res = await request(app)
        .put(`/api/tasks/${createRes.body._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });

    it('should update only description without changing other fields', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Original', description: 'Old desc' });

      const res = await request(app)
        .put(`/api/tasks/${createRes.body._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'New desc' });

      expect(res.status).toBe(200);
      expect(res.body.description).toBe('New desc');
      expect(res.body.title).toBe('Original');
    });

    it('should update dueDate to a value', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'No date' });

      const res = await request(app)
        .put(`/api/tasks/${createRes.body._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dueDate: '2025-06-15' });

      expect(res.status).toBe(200);
      expect(res.body.dueDate).toBeDefined();
    });

    it('should clear dueDate by setting to null', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Has date', dueDate: '2025-12-31' });

      const res = await request(app)
        .put(`/api/tasks/${createRes.body._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ dueDate: null });

      expect(res.status).toBe(200);
    });
  });
});
