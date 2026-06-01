import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hasAdminAccess } from '@/lib/admin-auth';
import { POST_INCLUDE, ensureUniqueSlug, nextPublishedAt, normalizeStatus, serializePost } from '@/lib/admin-posts';

const updateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().nullable().optional(),
  coverAlt: z.string().max(255).nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  genre: z.enum(['ESSAY', 'DIALOGUE', 'POEM', 'APHORISM', 'LETTER', 'REVIEW', 'INTERVIEW']).optional(),
  categoryId: z.string().nullable().optional(),
  humourId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id }, include: POST_INCLUDE });
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(serializePost(post));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const nextStatus = normalizeStatus(data.status, data.published ?? null);
  const nextSlug = data.slug?.trim()
    ? await ensureUniqueSlug(data.slug.trim(), params.id)
    : data.title
      ? await ensureUniqueSlug(data.title, params.id)
      : existing.slug;

  if (data.tagIds !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: params.id } });
  }

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(data.title ? { title: data.title.trim(), slug: nextSlug } : {}),
      ...(data.slug && !data.title ? { slug: nextSlug } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'excerpt') ? { excerpt: data.excerpt?.trim() || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'content') ? { content: data.content } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'coverImage') ? { coverImage: data.coverImage || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'coverAlt') ? { coverAlt: data.coverAlt?.trim() || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'featured') ? { featured: data.featured ?? false } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'genre') ? { genre: data.genre } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'categoryId') ? { categoryId: data.categoryId || null } : {}),
      ...(Object.prototype.hasOwnProperty.call(data, 'humourId') ? { humourId: data.humourId || null } : {}),
      status: nextStatus,
      published: nextStatus === 'PUBLISHED',
      publishedAt: nextPublishedAt(existing.publishedAt, nextStatus),
      aiSummary: Object.prototype.hasOwnProperty.call(data, 'content') ? null : undefined,
      ...(data.tagIds !== undefined ? { tags: { create: data.tagIds.map(tagId => ({ tagId })) } } : {}),
    },
    include: POST_INCLUDE,
  });

  return NextResponse.json(serializePost(post));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.post.update({
    where: { id: params.id },
    data: {
      status: 'ARCHIVED',
      published: false,
    },
  });

  return NextResponse.json({ success: true, post: serializePost(updated) });
}
