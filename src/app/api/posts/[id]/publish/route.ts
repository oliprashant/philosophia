import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  if (!['ADMIN', 'AUTHOR'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (role === 'AUTHOR' && post.authorId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const published = Boolean(body?.published);

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      published,
      publishedAt: published ? post.publishedAt ?? new Date() : null,
    },
    select: { id: true, published: true, publishedAt: true },
  });

  return NextResponse.json({
    id: updated.id,
    published: updated.published,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
  });
}
