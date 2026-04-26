// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  accessToken: z.string().min(1),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { accessToken, password } = parsed.data;
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user?.email) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const email = authData.user.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Account not found for this recovery link' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'This account uses Google sign-in and does not support password reset.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Reset Password POST]', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
