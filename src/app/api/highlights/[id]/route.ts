// src/app/api/highlights/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = (session.user as any).id as string;
  const highlight = await prisma.highlight.findUnique({ where: { id: params.id } });

  if (!highlight) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (highlight.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.highlight.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
