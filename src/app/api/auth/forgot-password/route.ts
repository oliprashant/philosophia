import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { sendLocalPasswordResetEmail } from '@/lib/password-reset';

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
      select: { email: true, firebaseUid: true, password: true, passwordHash: true, supabaseId: true },
    });

    if (!user?.email) {
      return NextResponse.json({ success: true });
    }

    const hasLocalPassword = Boolean(user.passwordHash || user.password);

    if (user.firebaseUid && !hasLocalPassword) {
      return NextResponse.json(
        {
          error: 'This account uses Google sign-in. Please sign in with Google. No password reset is available.',
        },
        { status: 400 }
      );
    }

    if (!hasLocalPassword) {
      return NextResponse.json({ success: true });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const redirectTo = `${appUrl}/auth/reset-password`;

    if (!user.supabaseId) {
      console.warn('[Forgot Password POST] User missing supabaseId, attempting reset anyway', { email });
    }

    try {
      const supabase = getSupabaseServerClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      if (!error) {
        return NextResponse.json({ success: true, mode: 'supabase' });
      }

      console.error('[Forgot Password POST] Supabase error:', {
        email,
        supabaseId: user.supabaseId,
        message: error.message,
        status: error.status,
      });

      if (error.status === 429 || /40 seconds/i.test(error.message)) {
        return NextResponse.json({ success: true, cooldown: true });
      }
    } catch (error) {
      console.error('[Forgot Password POST] Supabase reset failed, falling back to local token email', error);
    }

    const localResult = await sendLocalPasswordResetEmail({ email, appUrl });
    if (localResult.sent) {
      return NextResponse.json({ success: true, mode: 'token' });
    }

    return NextResponse.json({ error: 'Could not send reset link' }, { status: 500 });
  } catch (error) {
    console.error('[Forgot Password POST]', error);
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 });
  }
}
