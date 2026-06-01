import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionForUser, serializeUser, setSessionCookie } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getSupabaseServiceRoleClient } from '@/lib/supabase/admin';

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    const hash = await bcrypt.hash(password, 12);

    const supabase = getSupabaseServerClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || new URL(req.url).origin;
    const signUpResult = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: appUrl,
        data: { name },
      },
    });

    if (signUpResult.error || !signUpResult.data.user?.id) {
      const message = signUpResult.error?.message || 'Could not create Supabase account';
      console.error('[Auth Register POST] Supabase signUp error:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }

    if (existing?.emailVerified) {
      await getSupabaseServiceRoleClient().auth.admin.deleteUser(signUpResult.data.user.id).catch(error => {
        console.error('[Auth Register POST] rollback deleteUser error:', error);
      });
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const userData = {
      name,
      email: normalizedEmail,
      password: hash,
      passwordHash: hash,
      supabaseId: signUpResult.data.user.id,
      role: 'READER' as const,
      emailVerified: true,
    };

    const user = existing
      ? await prisma.user.update({
          where: { email: normalizedEmail },
          data: userData,
        })
      : await prisma.user.create({
          data: userData,
        });

    await prisma.verificationToken.deleteMany({ where: { identifier: normalizedEmail } });

    const session = await createSessionForUser(user.id);
    const response = NextResponse.json({ success: true, user: serializeUser(user) });
    setSessionCookie(response, session.sessionToken, session.expires);
    return response;
  } catch (error) {
    console.error('[Auth Register POST]', error);
    return NextResponse.json({ error: 'Could not register account' }, { status: 500 });
  }
}
