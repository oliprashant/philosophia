import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const savedPosts = await prisma.savedPost.findMany({
    where: { userId: session.user.id },
    orderBy: { savedAt: 'desc' },
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
    savedPosts: savedPosts.map(item => ({
      ...item.post,
      savedAt: item.savedAt.toISOString(),
      publishedAt: item.post.publishedAt?.toISOString() ?? null,
    })),
  });
}