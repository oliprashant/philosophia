import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true },
    });

    if (!user?.email || !user.password) {
      return NextResponse.json({ success: true });
    }

    const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS && (process.env.SMTP_FROM || process.env.SMTP_USER));

    if (hasSmtp) {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      const baseUrl = process.env.NEXTAUTH_URL || new URL(req.url).origin;
      const resetUrl = `${baseUrl}/auth/reset-password?token=${rawToken}`;

      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Reset your Philosophia password',
        html: `
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
        `,
      });

      if (!emailResult.sent) {
        console.error('[Forgot Password POST] Email transport unavailable or failed to send');
        return NextResponse.json({ error: 'Could not send reset link' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseServerClient();
    const origin = new URL(req.url).origin;
    const redirectTo = `${origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      console.error('[Forgot Password POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Could not send reset link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Forgot Password POST]', error);
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 });
  }
}
