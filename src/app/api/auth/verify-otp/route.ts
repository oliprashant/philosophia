import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6,8}$/, 'OTP must be 6 to 8 digits'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or OTP code' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const otp = parsed.data.otp.trim();

    // Password recovery flow (Supabase-backed OTP verification).
    const supabase = getSupabaseServerClient();

    const recoveryAttempt = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'recovery',
    });

    const result = recoveryAttempt.error
      ? await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        })
      : recoveryAttempt;

    if (result.error || !result.data.session?.access_token) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    return NextResponse.json({
      mode: 'recovery',
      accessToken: result.data.session.access_token,
      refreshToken: result.data.session.refresh_token,
    });
  } catch (error) {
    console.error('[Verify OTP POST]', error);
    return NextResponse.json({ error: 'Could not verify OTP' }, { status: 500 });
  }
}
