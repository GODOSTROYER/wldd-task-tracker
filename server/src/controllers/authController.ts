import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Workspace from '../models/Workspace';
import Task from '../models/Task';
import { AppError } from '../middleware/errorHandler';

const generateToken = (userId: string) => jwt.sign({ id: userId }, process.env.JWT_SECRET || 'change_me', { expiresIn: '7d' });

async function createDefaultWorkspaceAndTask(userId: string): Promise<void> {
  const workspace = await Workspace.create({ name: 'Getting Started', ownerId: userId });
  await Task.create({
    title: 'Complete your first ProductSpace task',
    description: 'Update this task to completed after reviewing the dashboard and creating your own tasks.',
    status: 'pending',
    ownerId: userId,
    workspaceId: workspace.id,
  });
}

export async function signup(req: any, res: any) {
  const { name, email, password } = req.body;
  const exists = await User.findOne({ where: { email } });
  if (exists) throw new AppError('Email already in use', 409);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await User.create({ name, email, password, verificationOtp: otp, verificationOtpExpiry: new Date(Date.now() + 10 * 60 * 1000) });
  res.status(201).json({ message: 'Account created', email });
}

export async function login(req: any, res: any) {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.comparePassword(password))) throw new AppError('Invalid credentials', 401);
  const token = generateToken(user.id);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

export async function verifyEmail(req: any, res: any) {
  const { email, otp } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError('User not found', 404);
  if (user.verificationOtp !== otp) throw new AppError('Invalid OTP', 400);
  user.isVerified = true;
  user.verificationOtp = null;
  user.verificationOtpExpiry = null;
  await user.save();

  const existingWorkspace = await Workspace.findOne({ where: { ownerId: user.id } });
  if (!existingWorkspace) {
    await createDefaultWorkspaceAndTask(user.id);
  }

  res.json({ message: 'Email verified', token: generateToken(user.id), user: { id: user.id, name: user.name, email: user.email } });
}

export async function forgotPassword(req: any, res: any) {
  const { email } = req.body;
  const user = await User.findOne({ where: { email } });
  if (user) {
    user.resetToken = crypto.randomBytes(32).toString('hex');
    user.resetTokenExpiry = new Date(Date.now() + 3600000);
    await user.save();
  }
  res.json({ message: 'If email exists, reset instructions sent' });
}
