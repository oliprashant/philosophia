import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
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
      select: { email: true, password: true },
    });

    // Keep enumeration protection behavior aligned with forgot-password.
    if (!user?.email || !user.password) {
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseServerClient();
    const resendResult = await supabase.auth.resend({
      // Cast to allow recovery type across Supabase SDK unions.
      type: 'recovery' as any,
      email,
    });

    const fallbackResult = resendResult.error
      ? await supabase.auth.resetPasswordForEmail(email)
      : { error: null };

    const error = resendResult.error ?? fallbackResult.error;

    if (error) {
      console.error('[Resend OTP POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Could not resend verification code' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Resend OTP POST]', error);
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 });
  }
}
