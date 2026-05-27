import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const upvotes = await prisma.upvote.findMany({
    where: {
      userId: session.user.id,
      postId: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImage: true,
          publishedAt: true,
        },
      },
    },
  });

  return NextResponse.json({
    upvotedPosts: upvotes
      .filter(item => item.post)
      .map(item => ({
        ...item.post!,
        upvotedAt: item.createdAt.toISOString(),
        publishedAt: item.post?.publishedAt?.toISOString() ?? null,
      })),
  });
}