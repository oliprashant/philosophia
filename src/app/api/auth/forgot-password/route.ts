// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
});

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'invalid-email';
  const safeLocal = local.length <= 2 ? `${local[0] ?? '*'}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const maskedEmail = maskEmail(email);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { email: true, password: true },
    });

    // Always return success to avoid user enumeration.
    if (!user?.email) {
      console.info(`[Forgot Password POST] skipped_no_user email=${maskedEmail}`);
      return NextResponse.json({ success: true });
    }

    // OAuth-only users (e.g., Google with no local password) do not have resettable credentials.
    if (!user.password) {
      console.info(`[Forgot Password POST] skipped_oauth_only email=${maskedEmail}`);
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('[Forgot Password POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Could not send verification code' }, { status: 500 });
    }

    console.info(`[Forgot Password POST] reset_email_requested email=${maskedEmail}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password POST]', err);
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 });
  }
}
