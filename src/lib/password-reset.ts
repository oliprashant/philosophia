import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';

type SendLocalPasswordResetEmailArgs = {
  email: string;
  appUrl: string;
};

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function sendLocalPasswordResetEmail({ email, appUrl }: SendLocalPasswordResetEmailArgs) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    return { sent: false as const };
  }

  const token = crypto.randomBytes(20).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
  const resetLink = new URL('/auth/reset-password', appUrl);
  resetLink.searchParams.set('token', token);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const displayName = user.name?.trim() || 'there';
  const result = await sendEmail({
    to: user.email,
    subject: 'Reset your Philosophia password',
    html: `
      <p>Hi ${displayName},</p>
      <p>Use the link below to reset your Philosophia password:</p>
      <p><a href="${resetLink.toString()}">${resetLink.toString()}</a></p>
      <p>This link expires in 1 hour. If you did not request a password reset, you can ignore this email.</p>
    `,
  });

  return { sent: result.sent, token };
}