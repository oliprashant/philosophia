import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionForUser, setSessionCookie, serializeUser } from '@/lib/auth';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const password = parsed.data.password;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const hash = user.passwordHash || user.password;
    if (!hash) {
      return NextResponse.json({ error: 'This account uses Google sign-in' }, { status: 400 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: 'Please verify your email before signing in' }, { status: 403 });
    }

    const passwordMatches = await bcrypt.compare(password, hash);
    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const session = await createSessionForUser(user.id);
    const response = NextResponse.json({ user: serializeUser(user) });
    setSessionCookie(response, session.sessionToken, session.expires);
    return response;
  } catch (error) {
    console.error('[Auth Login POST]', error);
    return NextResponse.json({ error: 'Could not sign in' }, { status: 500 });
  }
}