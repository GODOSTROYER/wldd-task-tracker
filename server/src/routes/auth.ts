import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { validate, z } from '../middleware/validate';
import { authMiddleware } from '../middleware';
import {
  forgotPassword,
  login,
  resendOtp,
  resetPassword,
  signup,
  updateProfile,
  verifyEmail,
} from '../controllers/authController';

const router = Router();
const passwordSchema = z.string().min(8).regex(/[A-Z]/).regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/);

router.post('/signup', validate(z.object({ name: z.string().min(1), email: z.string().email(), password: passwordSchema })), asyncHandler(signup));
router.post('/login', validate(z.object({ email: z.string().email(), password: z.string().min(1) })), asyncHandler(login));
router.post('/verify-email', validate(z.object({ email: z.string().email(), otp: z.string().length(6) })), asyncHandler(verifyEmail));
router.post('/resend-otp', validate(z.object({ email: z.string().email() })), asyncHandler(resendOtp));
router.post('/forgot-password', validate(z.object({ email: z.string().email() })), asyncHandler(forgotPassword));
router.post('/reset-password', validate(z.object({ token: z.string().min(1), password: passwordSchema })), asyncHandler(resetPassword));
router.put('/profile', authMiddleware, validate(z.object({ name: z.string().min(1).optional(), password: passwordSchema.optional() })), asyncHandler(updateProfile));

export default router;
