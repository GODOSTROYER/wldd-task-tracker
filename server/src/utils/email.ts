import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export async function sendVerificationEmail(to: string, otp: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify Your Email — Mini Task Tracker',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b;">Verify your email</h2>
        <p style="color: #475569;">Enter this code to complete your registration:</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4f46e5;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This code expires in 10 minutes. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset Your Password — Mini Task Tracker',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #1e293b;">Reset your password</h2>
        <p style="color: #475569;">Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
        <p style="color: #cbd5e1; font-size: 12px; word-break: break-all;">Or copy this link: ${resetUrl}</p>
      </div>
    `,
  });
}
