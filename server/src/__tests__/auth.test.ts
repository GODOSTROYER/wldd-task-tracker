import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import User from '../models/User';

describe('Auth Endpoints', () => {
  describe('POST /api/auth/signup', () => {
    it('should create a new user and return message + email (not token)', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Test User', email: 'test@example.com', password: 'Password1!' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('email', 'test@example.com');
      // Should NOT return token before verification
      expect(res.body).not.toHaveProperty('token');

      // User should exist but not be verified
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user!.isVerified).toBe(false);
      expect(user!.verificationOtp).toBeTruthy();
    });

    it('should return 409 for duplicate email', async () => {
      await User.create({ name: 'Existing', email: 'dup@example.com', password: 'Password1!' });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Another', email: 'dup@example.com', password: 'Password1!' });

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Email already in use');
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'no-name@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });

    it('should return 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Weak', email: 'weak@example.com', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/auth/verify-email', () => {
    let otp: string;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Verify User', email: 'verify@example.com', password: 'Password1!' });

      const user = await User.findOne({ email: 'verify@example.com' });
      otp = user!.verificationOtp!;
    });

    it('should verify email and return token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'verify@example.com', otp });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('verify@example.com');

      // User should now be verified
      const user = await User.findOne({ email: 'verify@example.com' });
      expect(user!.isVerified).toBe(true);
      expect(user!.verificationOtp).toBeNull();
    });

    it('should return 400 for wrong OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'verify@example.com', otp: '000000' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid verification code');
    });

    it('should return 400 for expired OTP', async () => {
      // Manually expire the OTP
      await User.updateOne(
        { email: 'verify@example.com' },
        { verificationOtpExpiry: new Date(Date.now() - 1000) }
      );

      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ email: 'verify@example.com', otp });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });

  describe('POST /api/auth/resend-otp', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Resend User', email: 'resend@example.com', password: 'Password1!' });
    });

    it('should regenerate OTP', async () => {
      const oldUser = await User.findOne({ email: 'resend@example.com' });
      const oldOtp = oldUser!.verificationOtp;

      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'resend@example.com' });

      expect(res.status).toBe(200);

      const newUser = await User.findOne({ email: 'resend@example.com' });
      expect(newUser!.verificationOtp).not.toBe(oldOtp);
    });

    it('should return 200 for non-existent email (no info leak)', async () => {
      const res = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a verified user
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Login User', email: 'login@example.com', password: 'Password1!' });
      await User.updateOne({ email: 'login@example.com' }, { isVerified: true });
    });

    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'Password1!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('login@example.com');
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@example.com', password: 'WrongPassword1!' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noone@example.com', password: 'Password1!' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('should return 403 for unverified user', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Unverified', email: 'unverified@example.com', password: 'Password1!' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unverified@example.com', password: 'Password1!' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('verify');
    });

    it('should return 400 for invalid login body', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Validation error');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Forgot User', email: 'forgot@example.com', password: 'Password1!' });
      await User.updateOne({ email: 'forgot@example.com' }, { isVerified: true });
    });

    it('should generate reset token', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@example.com' });

      expect(res.status).toBe(200);

      const user = await User.findOne({ email: 'forgot@example.com' });
      expect(user!.resetToken).toBeTruthy();
      expect(user!.resetTokenExpiry).toBeTruthy();
    });

    it('should return 200 for non-existent email (no info leak)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ name: 'Reset User', email: 'reset@example.com', password: 'Password1!' });
      await User.updateOne({ email: 'reset@example.com' }, { isVerified: true });

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      const user = await User.findOne({ email: 'reset@example.com' });
      resetToken = user!.resetToken!;
    });

    it('should reset password with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword1!' });

      expect(res.status).toBe(200);

      // Verify can login with new password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'reset@example.com', password: 'NewPassword1!' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
    });

    it('should return 400 for invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'NewPassword1!' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for expired token', async () => {
      await User.updateOne(
        { email: 'reset@example.com' },
        { resetTokenExpiry: new Date(Date.now() - 1000) }
      );

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: resetToken, password: 'NewPassword1!' });

      expect(res.status).toBe(400);
    });
  });
});
