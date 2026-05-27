import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      console.error('[Forgot Password POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Could not send reset link' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Forgot Password POST]', error);
    return NextResponse.json({ error: 'Could not process request' }, { status: 500 });
  }
}
