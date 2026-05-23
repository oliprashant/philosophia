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
    console.error('[Forgot Password POST] raw body preview:', raw ? raw.slice(0, 300) : '<empty>');
    try {
      // Fast-path: some clients (PowerShell curl variants) send {email:foo@bar} (no quotes).
      // Detect that shape and extract without invoking JSON.parse which will throw.
      const unquotedObjMatch = /\{\s*email\s*:\s*([^\}\s]+)\s*\}/i.exec(raw || '');
      if (unquotedObjMatch && unquotedObjMatch[1]) {
        body = { email: unquotedObjMatch[1] };
      } else {
        body = raw ? JSON.parse(raw) : {};
      }
    } catch (parseErr) {
      // Try multiple tolerant parsing strategies in order and return the first match.
      const tryExtractEmail = () => {
        try {
          // 1) application/x-www-form-urlencoded
          const params = new URLSearchParams(raw);
          const emailFromParams = params.get('email');
          if (emailFromParams) return decodeURIComponent(emailFromParams);

          // 2) email=... within body
          const m = /email\s*=\s*([^&\s]+)/i.exec(raw);
          if (m && m[1]) return decodeURIComponent(m[1]);

          // 3) {email:someone@domain} without quotes
          const m2 = /\{\s*email\s*:\s*([^\}\s]+)\s*\}/i.exec(raw);
          if (m2 && m2[1]) return decodeURIComponent(m2[1]);

          // 4) any email-like substring
          const emailMatch = raw.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
          if (emailMatch && emailMatch[1]) return emailMatch[1];

          // 5) permissive: find '@' and expand outward to capture token
          const at = raw.indexOf('@');
          if (at !== -1) {
            const leftChars = ' \n\r\t,;:\"\'`{}[]()<>|';
            let l = at - 1;
            while (l >= 0 && !leftChars.includes(raw[l])) l -= 1;
            let r = at + 1;
            while (r < raw.length && !leftChars.includes(raw[r])) r += 1;
            const candidate = raw.slice(l + 1, r).trim();
            if (candidate) return candidate;
          }

          return null;
        } catch (e) {
          return null;
        }
      };

      const extracted = tryExtractEmail();
      if (extracted) body = { email: extracted };
      else {
        console.error('[Forgot Password POST] Invalid JSON body and could not parse as urlencoded:', raw, parseErr && parseErr.message ? parseErr.message : parseErr);
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
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
