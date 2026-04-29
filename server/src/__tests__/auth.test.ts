import request from 'supertest';
import app from '../app';
import User from '../models/User';
import Workspace from '../models/Workspace';

async function signupUser(email = 'test@example.com') {
  await request(app)
    .post('/api/auth/signup')
    .send({ name: 'Test User', email, password: 'Password1!' });

  return User.findOne({ where: { email } });
}

describe('Auth Endpoints', () => {
  it('creates an unverified user and sends an OTP', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com', password: 'Password1!' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('test@example.com');

    const user = await User.findOne({ where: { email: 'test@example.com' } });
    expect(user?.isVerified).toBe(false);
    expect(user?.verificationOtp).toHaveLength(6);
  });

  it('rejects duplicate signup and weak password input', async () => {
    await signupUser('dup@example.com');

    const duplicate = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Duplicate', email: 'dup@example.com', password: 'Password1!' });
    expect(duplicate.status).toBe(409);

    const weak = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Weak', email: 'weak@example.com', password: 'short' });
    expect(weak.status).toBe(400);
  });

  it('requires email verification before login', async () => {
    await signupUser('login@example.com');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'Password1!' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('verify');
  });

  it('verifies email, creates default workspace, and returns a JWT', async () => {
    const user = await signupUser('verify@example.com');

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'verify@example.com', otp: user!.verificationOtp });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('verify@example.com');

    const verified = await User.findOne({ where: { email: 'verify@example.com' } });
    expect(verified?.isVerified).toBe(true);

    const workspace = await Workspace.findOne({ where: { ownerId: verified!.id } });
    expect(workspace?.name).toBe('Getting Started');
  });

  it('rejects invalid or expired OTPs and can resend an OTP', async () => {
    const user = await signupUser('otp@example.com');
    user!.verificationOtpExpiry = new Date(Date.now() - 1000);
    await user!.save();

    const expired = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'otp@example.com', otp: user!.verificationOtp });
    expect(expired.status).toBe(400);
    expect(expired.body.message).toContain('expired');

    const resend = await request(app)
      .post('/api/auth/resend-otp')
      .send({ email: 'otp@example.com' });
    expect(resend.status).toBe(200);

    const refreshed = await User.findOne({ where: { email: 'otp@example.com' } });
    expect(refreshed!.verificationOtp).not.toBe(user!.verificationOtp);
  });

  it('supports forgot password and reset password', async () => {
    const user = await signupUser('reset@example.com');
    await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'reset@example.com', otp: user!.verificationOtp });

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' });
    expect(forgot.status).toBe(200);

    const withToken = await User.findOne({ where: { email: 'reset@example.com' } });
    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: withToken!.resetToken, password: 'NewPassword1!' });
    expect(reset.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'NewPassword1!' });
    expect(login.status).toBe(200);
  });

  it('updates profile for the authenticated user', async () => {
    const user = await signupUser('profile@example.com');
    const verify = await request(app)
      .post('/api/auth/verify-email')
      .send({ email: 'profile@example.com', otp: user!.verificationOtp });

    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${verify.body.token}`)
      .send({ name: 'Updated User' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated User');
  });
});
