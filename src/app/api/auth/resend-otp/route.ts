import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/mailer';
import { getSupabaseServerClient } from '@/lib/supabase/server';

const schema = z.object({
  email: z.string().email(),
});

function generateOtp(length = 8) {
  const max = 10 ** length;
  return String(Math.floor(Math.random() * max)).padStart(length, '0');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();

    // If this is an unverified local account, resend registration OTP from Prisma.
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: otp,
          expires: expiresAt,
        },
      });

      await sendEmail({
        to: email,
        subject: 'Your Philosophia verification code',
        html: `<p>Your verification code is <strong>${otp}</strong>.</p><p>This code expires in 30 minutes.</p>`,
      });

      return NextResponse.json({ success: true, mode: 'registration' });
    }

    // Otherwise, resend recovery OTP/link from Supabase using resetPasswordForEmail.
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      console.error('[Resend OTP POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Could not resend reset link' }, { status: 500 });
    }

    return NextResponse.json({ success: true, mode: 'recovery' });
  } catch (error) {
    console.error('[Resend OTP POST]', error);
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 });
  }
}
