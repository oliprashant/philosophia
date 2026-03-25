import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json({
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
    },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body = await req.json();

  const data: { name?: string | null; bio?: string | null; image?: string | null } = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    if (typeof body.name !== 'string') return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
    data.name = body.name.trim().slice(0, 120) || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'bio')) {
    if (typeof body.bio !== 'string') return NextResponse.json({ error: 'Invalid bio' }, { status: 400 });
    data.bio = body.bio.trim().slice(0, 1000) || null;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'image')) {
    if (body.image !== null && typeof body.image !== 'string') {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 });
    }
    data.image = body.image;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    user: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    },
  });
}