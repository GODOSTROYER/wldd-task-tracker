import crypto from 'crypto';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Workspace from '../models/Workspace';
import Task from '../models/Task';
import { sendPasswordResetEmail, sendVerificationEmail } from '../email';
import { AuthRequest } from '../middleware';
import { AppError } from '../middleware/errorHandler';

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new AppError('JWT secret is not configured', 500);
  }
  return secret || 'change_me';
}

const generateToken = (userId: string) => jwt.sign({ id: userId }, jwtSecret(), { expiresIn: '7d' });

function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function createDefaultWorkspaceAndTasks(userId: string): Promise<Workspace> {
  const workspace = await Workspace.create({ name: 'Getting Started', ownerId: userId });
  await Task.bulkCreate([
    {
      title: 'Create your first ProductSpace task',
      description: 'Use the New task button to add work to this workspace.',
      status: 'todo',
      priority: 'medium',
      position: 1024,
      ownerId: userId,
      workspaceId: workspace.id,
    },
    {
      title: 'Drag a task across the board',
      description: 'Move this card through the workflow to confirm ordering and status updates.',
      status: 'in-progress',
      priority: 'low',
      position: 2048,
      ownerId: userId,
      workspaceId: workspace.id,
    },
    {
      title: 'Mark a task completed',
      description: 'Completed tasks stay owned by you and visible only in your account.',
      status: 'completed',
      priority: 'high',
      position: 3072,
      ownerId: userId,
      workspaceId: workspace.id,
    },
  ]);
  return workspace;
}

export async function signup(req: Request, res: Response) {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ where: { email } });
  if (exists) throw new AppError('Email already in use', 409);

  const otp = generateOtp();
  await User.create({
    name,
    email,
    password,
    verificationOtp: otp,
    verificationOtpExpiry: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendVerificationEmail(email, otp);
  res.status(201).json({ message: 'Account created. Check your email for the verification code.', email });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid credentials', 401);
  if (!user.isVerified) throw new AppError('Please verify your email before signing in', 403);

  res.json({ token: generateToken(user.id), user: publicUser(user) });
}

export async function verifyEmail(req: Request, res: Response) {
  const { email, otp } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !user.verificationOtp || !user.verificationOtpExpiry) {
    throw new AppError('Invalid verification code', 400);
  }
  if (user.verificationOtp !== otp) throw new AppError('Invalid verification code', 400);
  if (user.verificationOtpExpiry.getTime() < Date.now()) {
    throw new AppError('Verification code has expired', 400);
  }

  user.isVerified = true;
  user.verificationOtp = null;
  user.verificationOtpExpiry = null;
  await user.save();

  const existingWorkspace = await Workspace.findOne({ where: { ownerId: user.id } });
  if (!existingWorkspace) {
    await createDefaultWorkspaceAndTasks(user.id);
  }

  res.json({ message: 'Email verified', token: generateToken(user.id), user: publicUser(user) });
}

export async function resendOtp(req: Request, res: Response) {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user && !user.isVerified) {
    const otp = generateOtp();
    user.verificationOtp = otp;
    user.verificationOtpExpiry = new Date(Date.now() + OTP_TTL_MS);
    await user.save();
    await sendVerificationEmail(email, otp);
  }

  res.json({ message: 'Verification code sent if the account exists and is not already verified.' });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user) {
    user.resetToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenExpiry = new Date(Date.now() + RESET_TTL_MS);
    await user.save();
    await sendPasswordResetEmail(email, user.resetToken);
  }

  res.json({ message: 'If email exists, reset instructions sent' });
}

export async function resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  const user = await User.findOne({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry.getTime() < Date.now()) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  user.password = password;
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  res.json({ message: 'Password reset successfully' });
}

export async function updateProfile(req: AuthRequest, res: Response) {
  const user = await User.findByPk(req.user!.id);
  if (!user) throw new AppError('User not found', 404);

  if (typeof req.body.name === 'string') user.name = req.body.name;
  if (typeof req.body.password === 'string') user.password = req.body.password;
  await user.save();

  res.json({ message: 'Profile updated', user: publicUser(user) });
}
