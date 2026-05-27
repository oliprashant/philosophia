import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const comments = await prisma.comment.findMany({
    where: { authorId: session.user.id, deleted: false },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
  });

  return NextResponse.json({
    comments: comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      post: comment.post,
    })),
  });
}