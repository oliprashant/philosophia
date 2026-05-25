import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schema = z.object({
  uid: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().max(120).optional().nullable(),
  photoURL: z.string().url().optional().nullable(),
});

function serializeUser(user: {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  firebaseUid: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid Firebase user payload' }, { status: 400 });
    }

    const uid = parsed.data.uid.trim();
    const email = parsed.data.email.toLowerCase().trim();
    const displayName = parsed.data.displayName?.trim() || null;
    const photoURL = parsed.data.photoURL?.trim() || null;

    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    const existingByUid = await prisma.user.findFirst({ where: { firebaseUid: uid } });
    const user = existingByEmail ?? existingByUid;

    if (user) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          firebaseUid: user.firebaseUid ?? uid,
          email,
          name: user.name || displayName,
          image: photoURL || user.image,
          emailVerified: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          role: true,
          firebaseUid: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({ user: serializeUser(updated) });
    }

    const created = await prisma.user.create({
      data: {
        email,
        firebaseUid: uid,
        name: displayName,
        image: photoURL,
        emailVerified: true,
        role: 'READER',
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        role: true,
        firebaseUid: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: serializeUser(created) }, { status: 201 });
  } catch (error) {
    console.error('[Firebase Sync POST]', error);
    return NextResponse.json({ error: 'Could not sync Firebase user' }, { status: 500 });
  }
}