// src/app/api/comments/[id]/route.ts
// DELETE /api/comments/:id  → soft-delete (sets deleted=true)
// Only the comment owner or an admin can delete.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const status = body?.status as 'Approved' | 'Pending' | 'Spam' | undefined;
  if (!status) return NextResponse.json({ error: 'status required' }, { status: 400 });

  const existing = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.comment.update({
    where: { id: params.id },
    data: {
      deleted: status === 'Spam',
    },
    include: {
      author: { select: { name: true } },
      post: { select: { title: true, slug: true } },
    },
  });

  return NextResponse.json({
    id: updated.id,
    text: updated.content,
    author: { name: updated.author?.name ?? updated.guestName ?? 'Anonymous' },
    post: updated.post,
    status: updated.deleted ? 'Spam' : status,
    createdAt: updated.createdAt.toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const comment = await prisma.comment.findUnique({ where: { id: params.id } });
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Allow: owner OR admin
  if (comment.authorId !== userId && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.comment.update({ where: { id: params.id }, data: { deleted: true, content: '' } });
  return NextResponse.json({ success: true });
}
