// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const db = prisma as any;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const resetToken = await db.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: passwordHash },
      }),
      db.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      db.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, usedAt: null },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Reset Password POST]', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
