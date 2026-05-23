// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
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
    console.info('[Forgot Password POST] invoked', { path: req.nextUrl.pathname, method: req.method });
    // Read raw body first to capture malformed JSON in logs if present
    let raw = '';
    try {
      raw = await req.text();
    } catch (e) {
      console.error('[Forgot Password POST] req.text() failed', e);
      return NextResponse.json({ error: 'Could not read request body' }, { status: 500 });
    }

    let body: any = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch (parseErr) {
      console.error('[Forgot Password POST] Invalid JSON body:', raw, parseErr && parseErr.message ? parseErr.message : parseErr);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const maskedEmail = maskEmail(email);

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('[Forgot Password POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Could not send reset link' }, { status: 500 });
    }

    console.info(`[Forgot Password POST] reset_email_requested email=${maskedEmail}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password POST]', err);
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 });
  }
}
