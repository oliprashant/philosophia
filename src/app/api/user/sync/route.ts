import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSessionForUser, serializeUser, setSessionCookie } from '@/lib/auth';

const schema = z.object({
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  name: z.string().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid Firebase user payload' }, { status: 400 });
    }

    const firebaseUid = parsed.data.firebaseUid.trim();
    const email = parsed.data.email.toLowerCase().trim();
    const name = parsed.data.name?.trim() || null;
    const image = parsed.data.image?.trim() || null;

    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    const existingByUid = await prisma.user.findFirst({ where: { firebaseUid } });
    const user = existingByEmail ?? existingByUid;

    const nextUser = user
      ? await prisma.user.update({
          where: { id: user.id },
          data: {
            firebaseUid,
            email,
            name: user.name || name,
            image: image || user.image,
            emailVerified: true,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            firebaseUid,
            name,
            image,
            emailVerified: true,
            role: 'READER',
          },
        });

    const session = await createSessionForUser(nextUser.id);
    const response = NextResponse.json({ user: serializeUser(nextUser) }, { status: user ? 200 : 201 });
    setSessionCookie(response, session.sessionToken, session.expires);
    return response;
  } catch (error) {
    console.error('[User Sync POST]', error);
    return NextResponse.json({ error: 'Could not sync Firebase user' }, { status: 500 });
  }
}