import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  refreshToken: z.string().min(1).optional(),
});

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { token, newPassword, refreshToken } = parsed.data;

    // Preferred reset path: Supabase recovery session.
    if (refreshToken) {
      const supabase = getSupabaseServerClient();
      const sessionResult = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });

      if (sessionResult.error) {
        console.error('[Reset Password POST] Supabase setSession error:', sessionResult.error.message);
      } else {
        const updateResult = await supabase.auth.updateUser({ password: newPassword });
        if (updateResult.error) {
          console.error('[Reset Password POST] Supabase updateUser error:', updateResult.error.message);
          return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
        }
        return NextResponse.json({ success: true, mode: 'recovery' });
      }
    }

    // Fallback reset path: Prisma token-based reset.
    const tokenHash = hashToken(token);
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: passwordHash,
          passwordHash,
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, mode: 'token' });
  } catch (error) {
    console.error('[Reset Password POST]', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
