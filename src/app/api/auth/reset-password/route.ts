// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  refreshToken: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const { token, newPassword, refreshToken } = parsed.data;
    const supabase = getSupabaseServerClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user?.email) {
      return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 });
    }

    const email = authData.user.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Account not found for this recovery link' }, { status: 404 });
    }

    if (!user.password && !user.passwordHash) {
      return NextResponse.json(
        { error: 'This account uses Google sign-in and does not support password reset.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase credentials are not configured' }, { status: 500 });
    }

    // Prefer SDK session flow if refresh token is available.
    let supabaseUpdated = false;
    if (refreshToken) {
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken,
      });

      if (!setSessionError) {
        const { error: updateUserError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        supabaseUpdated = !updateUserError;
      }
    }

    // Fallback: call GoTrue endpoint directly with access token.
    if (!supabaseUpdated) {
      const supabaseResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: 'PUT',
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!supabaseResponse.ok) {
        const rawError = await supabaseResponse.text();
        console.error('[Reset Password POST] Supabase update error:', rawError);
        return NextResponse.json({ error: 'Could not update password in Supabase' }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: passwordHash, passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Reset Password POST]', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
