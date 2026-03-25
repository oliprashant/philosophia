// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { randomBytes, createHash } from 'crypto';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const db = prisma as any;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    // Always return success to avoid user enumeration.
    if (!user || !user.email) {
      return NextResponse.json({ success: true });
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

    await db.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}`;

    const html = `
      <div style="font-family: Georgia, serif; line-height: 1.6; color: #2b2b2b;">
        <h2 style="margin-bottom: 8px;">Reset your Philosophia password</h2>
        <p>Hello ${user.name ?? 'Reader'},</p>
        <p>We received a request to reset your password. Click the button below to continue:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#1f1408;color:#fff;padding:10px 18px;text-decoration:none;display:inline-block;">Reset Password</a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: user.email,
      subject: 'Reset your Philosophia password',
      html,
    });

    if (!emailResult.sent) {
      console.log('[Forgot Password] SMTP not configured. Reset link:', resetUrl);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password POST]', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
