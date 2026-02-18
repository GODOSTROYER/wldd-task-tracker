import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';

const router = Router();

// --- Schemas ---
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/, 'Password must contain at least one special character');

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
});

const resendOtpSchema = z.object({
  email: z.string().email('Invalid email'),
});

// --- Helpers ---
function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'change_me_to_a_strong_secret';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// --- POST /api/auth/signup ---
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await User.create({
      name,
      email,
      password,
      verificationOtp: otp,
      verificationOtpExpiry: otpExpiry,
    });

    // Send verification email (don't block on failure)
    try {
      await sendVerificationEmail(email, otp);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    res.status(201).json({
      message: 'Account created. Please check your email for the verification code.',
      email,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- POST /api/auth/verify-email ---
router.post('/verify-email', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = verifyEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, otp } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'Email is already verified' });
      return;
    }

    if (!user.verificationOtp || user.verificationOtp !== otp) {
      res.status(400).json({ message: 'Invalid verification code' });
      return;
    }

    if (!user.verificationOtpExpiry || user.verificationOtpExpiry < new Date()) {
      res.status(400).json({ message: 'Verification code has expired. Request a new one.' });
      return;
    }

    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpiry = null;
    await user.save();

    const token = generateToken(user._id.toString());

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- POST /api/auth/resend-otp ---
router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = resendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether user exists
      res.status(200).json({ message: 'If that email is registered, a new code has been sent.' });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: 'Email is already verified' });
      return;
    }

    const otp = generateOtp();
    user.verificationOtp = otp;
    user.verificationOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(email, otp);
    } catch (emailErr) {
      console.error('Failed to send verification email:', emailErr);
    }

    res.status(200).json({ message: 'If that email is registered, a new code has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- POST /api/auth/login ---
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: 'Please verify your email before logging in', email: user.email });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- POST /api/auth/forgot-password ---
router.post('/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email } = parsed.data;

    // Always return success to not reveal whether email exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
      return;
    }

    const resetToken = generateResetToken();
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr);
    }

    res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// --- POST /api/auth/reset-password ---
router.post('/reset-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { token, password } = parsed.data;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset link' });
      return;
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
