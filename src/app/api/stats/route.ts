import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [totalPosts, totalComments, totalUsers, viewAgg] = await Promise.all([
    prisma.post.count(),
    prisma.comment.count({ where: { deleted: false } }),
    prisma.user.count(),
    prisma.post.aggregate({ _sum: { viewCount: true } }),
  ]);

  return NextResponse.json({
    totalPosts,
    totalComments,
    totalUsers,
    totalViews: viewAgg._sum.viewCount ?? 0,
  });
}
