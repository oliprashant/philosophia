// src/app/api/posts/route.ts
// GET  /api/posts  → list/search posts with filters
// POST /api/posts  → create a new post (admin/author only)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import slugify from 'slugify';
import { z } from 'zod';
import { formSlugToGenre } from '@/lib/forms';

// Shared post include for consistent responses
const POST_INCLUDE = {
  author: { select: { id: true, name: true, image: true, bio: true, role: true } },
  category: true,
  humour: true,
  tags: { include: { tag: true } },
  _count: { select: { upvotes: true, comments: true } },
};

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as string | undefined;
  const adminMode = searchParams.get('admin') === 'true';
  const isAdmin = role === 'ADMIN';

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '12'));
  const skip = (page - 1) * limit;
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const genre = searchParams.get('genre') || '';
  const formSlug = searchParams.get('formSlug') || searchParams.get('form') || '';
  const humour = searchParams.get('humour') || '';
  const tag = searchParams.get('tag') || '';
  const author = searchParams.get('author') || '';
  const sort = searchParams.get('sort') || 'newest';
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const saved = searchParams.get('saved') === 'true';
  const upvoted = searchParams.get('upvoted') === 'true';
  const history = searchParams.get('history') === 'true';

  if ((saved || upvoted || history) && !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const where: any = adminMode && isAdmin ? {} : { published: true };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (category) where.category = { slug: category };
  if (genre) where.genre = genre.toUpperCase();
  if (formSlug) {
    const formGenre = formSlugToGenre(formSlug);
    if (!formGenre) {
      return NextResponse.json({ items: [], total: 0, page, limit, hasMore: false });
    }
    where.genre = formGenre;
  }
  if (humour) where.humour = { slug: humour };
  if (tag) where.tags = { some: { tag: { slug: tag } } };
  if (author) where.authorId = author;
  if (dateFrom || dateTo) {
    where.publishedAt = {};
    if (dateFrom) where.publishedAt.gte = new Date(dateFrom);
    if (dateTo) where.publishedAt.lte = new Date(dateTo);
  }

  const orderBy: any =
    sort === 'upvotes'   ? { upvotes: { _count: 'desc' } } :
    sort === 'comments'  ? { comments: { _count: 'desc' } } :
    sort === 'views'     ? { viewCount: 'desc' } :
    sort === 'oldest'    ? { publishedAt: 'asc' } :
                           { publishedAt: 'desc' };

  const serialize = (p: any) => ({
    ...p,
    tags: p.tags.map((pt: any) => pt.tag),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  });

  if (saved && userId) {
    const [savedRows, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId, post: { published: true } },
        orderBy: { savedAt: 'desc' },
        skip,
        take: limit,
        include: { post: { include: POST_INCLUDE } },
      }),
      prisma.savedPost.count({ where: { userId, post: { published: true } } }),
    ]);

    const posts = savedRows.map(row => row.post);
    return NextResponse.json({ items: posts.map(serialize), total, page, limit, hasMore: skip + limit < total });
  }

  if (upvoted && userId) {
    const [upvoteRows, total] = await Promise.all([
      prisma.upvote.findMany({
        where: { userId, postId: { not: null }, post: { is: { published: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { post: { include: POST_INCLUDE } },
      }),
      prisma.upvote.count({ where: { userId, postId: { not: null }, post: { is: { published: true } } } }),
    ]);

    const posts = upvoteRows.map(row => row.post).filter(Boolean);
    return NextResponse.json({ items: posts.map(serialize), total, page, limit, hasMore: skip + limit < total });
  }

  if (history && userId) {
    const [historyRows, total] = await Promise.all([
      prisma.readingHistory.findMany({
        where: { userId, post: { published: true } },
        orderBy: { readAt: 'desc' },
        skip,
        take: limit,
        include: { post: { include: POST_INCLUDE } },
      }),
      prisma.readingHistory.count({ where: { userId, post: { published: true } } }),
    ]);

    const posts = historyRows.map(row => row.post);
    return NextResponse.json({ items: posts.map(serialize), total, page, limit, hasMore: skip + limit < total });
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({ where, include: POST_INCLUDE, orderBy, skip, take: limit }),
    prisma.post.count({ where }),
  ]);

  return NextResponse.json({ items: posts.map(serialize), total, page, limit, hasMore: skip + limit < total });
}

// ── POST ───────────────────────────────────────────────────────────────────────
const createSchema = z.object({
  title: z.string().min(3).max(255),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1),
  coverImage: z.string().url().optional(),
  coverAlt: z.string().max(255).optional(),
  genre: z.enum(['ESSAY', 'DIALOGUE', 'POEM', 'APHORISM', 'LETTER', 'REVIEW', 'INTERVIEW']),
  categoryId: z.string().optional(),
  humourId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  readingTime: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string;
  if (!['ADMIN', 'AUTHOR'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });

  const { tagIds, ...data } = parsed.data;
  const authorId = (session.user as any).id as string;

  // Generate unique slug
  const base = slugify(data.title, { lower: true, strict: true });
  let slug = base;
  let suffix = 1;
  while (await prisma.post.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }

  // Estimate reading time if not provided (~200 words/min)
  const wordCount = data.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = data.readingTime ?? Math.max(1, Math.round(wordCount / 200));

  const post = await prisma.post.create({
    data: {
      ...data,
      slug,
      authorId,
      readingTime,
      publishedAt: data.published ? new Date() : null,
      tags: tagIds?.length
        ? { create: tagIds.map(tagId => ({ tagId })) }
        : undefined,
    },
    include: POST_INCLUDE,
  });

  return NextResponse.json({
    ...post,
    tags: (post as any).tags.map((pt: any) => pt.tag),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
  }, { status: 201 });
}
