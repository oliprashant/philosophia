import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminAccess } from '@/lib/admin-auth';
import { POST_INCLUDE, normalizeStatus, serializePost } from '@/lib/admin-posts';

export async function GET(req: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const status = searchParams.get('status') || 'all';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || 20)));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { slug: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (status !== 'all') {
    where.status = normalizeStatus(status.toUpperCase(), null);
  }

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      include: POST_INCLUDE,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map(serializePost),
    total,
    page,
    limit,
    hasMore: skip + limit < total,
  });
}
