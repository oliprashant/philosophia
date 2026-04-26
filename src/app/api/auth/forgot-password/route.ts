// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

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

    // Always return success to avoid user enumeration.
    if (!user?.email) {
      return NextResponse.json({ success: true });
    }

    // OAuth-only users (e.g., Google with no local password) do not have resettable credentials.
    if (!user.password) {
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseServerClient();
    const origin = new URL(req.url).origin;
    const isLocal = origin.includes('localhost');
    const redirectBase = isLocal ? 'http://localhost:3000' : 'https://blogs.oliprashant.com.np';
    const redirectTo = `${redirectBase}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      console.error('[Forgot Password POST] Supabase error:', error.message);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Forgot Password POST]', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
