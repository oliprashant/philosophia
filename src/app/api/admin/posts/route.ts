import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hasAdminAccess } from '@/lib/admin-auth';
import { POST_INCLUDE, ensureUniqueSlug, nextPublishedAt, normalizeStatus, serializePost } from '@/lib/admin-posts';

const createSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  content: z.string().trim().min(1, 'Content is required'),
  categoryId: z.union([z.string().trim().min(1), z.literal('None')]).optional().nullable(),
  excerpt: z.string().trim().max(500).optional().nullable(),
  slug: z.string().trim().max(255).optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
  coverAlt: z.string().trim().max(255).optional().nullable(),
  genre: z.enum(['ESSAY', 'DIALOGUE', 'POEM', 'APHORISM', 'LETTER', 'REVIEW', 'INTERVIEW']).optional(),
  humourId: z.string().trim().min(1).optional().nullable(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

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

export async function POST(req: NextRequest) {
  try {
    if (!(await hasAdminAccess())) {
      return jsonError('Admin session missing', 401, 'You must sign in with the admin password before creating posts.');
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[Admin Posts POST] Failed to parse request body', error);
      return jsonError('Invalid JSON body', 400, error instanceof Error ? error.message : String(error));
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid post data', 400, parsed.error.flatten());
    }

    const data = parsed.data;
    const title = data.title.trim();
    const content = data.content.trim();
    const categoryId = data.categoryId && data.categoryId !== 'None' ? data.categoryId : null;

    if (!title || !content) {
      return jsonError('Missing required fields', 400, 'title and content are required');
    }

    if (data.status === 'PUBLISHED' && data.published === false) {
      return jsonError('Invalid publish state', 400, 'A published post must be marked as published');
    }

    const slug = await ensureUniqueSlug(data.slug?.trim() || title);
    const published = normalizeStatus(data.status, data.published ?? null) === 'PUBLISHED';
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });

    if (!adminUser) {
      console.error('[Admin Posts POST] No admin user found in database');
      return jsonError('Admin user not found', 500, 'Create or assign an ADMIN user before creating posts.');
    }

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt: data.excerpt?.trim() || null,
        content,
        coverImage: data.coverImage || null,
        coverAlt: data.coverAlt?.trim() || null,
        genre: data.genre ?? 'ESSAY',
        status: normalizeStatus(data.status, data.published ?? null),
        published,
        publishedAt: published ? new Date() : null,
        featured: data.featured ?? false,
        categoryId,
        humourId: data.humourId || null,
        readingTime: Math.max(1, Math.round(content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length / 200)),
        authorId: adminUser.id,
      },
      include: POST_INCLUDE,
    });

    return NextResponse.json(
      {
        success: true,
        ...serializePost(post),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Admin Posts POST] Unhandled error', error);
    return jsonError('Could not create post', 500, error instanceof Error ? error.stack || error.message : String(error));
  }
}
