// src/app/api/comments/[id]/route.ts
// DELETE /api/comments/:id  → soft-delete (sets deleted=true)
// Only the comment owner or an admin can delete.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

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
