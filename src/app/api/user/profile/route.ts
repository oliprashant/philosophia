import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, serializeUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const profileSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  bio: true,
  facebook: true,
  instagram: true,
  pinterest: true,
  role: true,
  firebaseUid: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

const updateSchema = z.object({
  name: z.string().max(120).nullable().optional(),
  bio: z.string().max(1000).nullable().optional(),
  image: z.string().url().nullable().optional(),
  facebook: z.string().url().nullable().optional(),
  instagram: z.string().url().nullable().optional(),
  pinterest: z.string().url().nullable().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({ user: serializeUser(user) });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(Object.prototype.hasOwnProperty.call(parsed.data, 'name') ? { name: parsed.data.name?.trim() || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, 'bio') ? { bio: parsed.data.bio?.trim() || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, 'image') ? { image: parsed.data.image || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, 'facebook') ? { facebook: parsed.data.facebook || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, 'instagram') ? { instagram: parsed.data.instagram || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(parsed.data, 'pinterest') ? { pinterest: parsed.data.pinterest || null } : {}),
    },
    select: profileSelect,
  });

  return NextResponse.json({ user: serializeUser(updated) });
}