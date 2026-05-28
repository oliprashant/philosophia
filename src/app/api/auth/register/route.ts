import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionForUser, serializeUser, setSessionCookie } from '@/lib/auth';

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

    if (existing && existing.emailVerified) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = existing
      ? await prisma.user.update({
          where: { email: normalizedEmail },
          data: {
            name,
            password: hash,
            passwordHash: hash,
            emailVerified: true,
          },
        })
      : await prisma.user.create({
          data: {
            name,
            email: normalizedEmail,
            password: hash,
            passwordHash: hash,
            role: 'READER',
            emailVerified: true,
          },
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
