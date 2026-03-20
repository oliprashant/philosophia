// src/app/api/posts/[id]/route.ts
// GET    /api/posts/:id  → fetch single post (admin can see unpublished)
// PATCH  /api/posts/:id  → update post (admin/author)
// DELETE /api/posts/:id  → delete post (admin only)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import slugify from 'slugify';
import { z } from 'zod';

const POST_INCLUDE = {
  author: { select: { id: true, name: true, image: true, bio: true, role: true } },
  category: true, humour: true,
  tags: { include: { tag: true } },
  _count: { select: { upvotes: true, comments: true } },
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: POST_INCLUDE,
  });

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!post.published && !isAdmin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    ...post,
    tags: (post as any).tags.map((pt: any) => pt.tag),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  });
}

const updateSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(1).optional(),
  coverImage: z.string().url().optional().nullable(),
  coverAlt: z.string().max(255).optional(),
  genre: z.enum(['ESSAY', 'DIALOGUE', 'POEM', 'APHORISM', 'LETTER', 'REVIEW', 'INTERVIEW']).optional(),
  categoryId: z.string().optional().nullable(),
  humourId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  readingTime: z.number().int().positive().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = (session.user as any).role as string;
  const userId = (session.user as any).id as string;
  if (!['ADMIN', 'AUTHOR'].includes(role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const existing = await prisma.post.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Authors can only edit their own posts
  if (role === 'AUTHOR' && existing.authorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { tagIds, title, ...rest } = parsed.data;

  // Re-slug if title changed
  let slug = existing.slug;
  if (title && title !== existing.title) {
    const base = slugify(title, { lower: true, strict: true });
    slug = base;
    let suffix = 1;
    while (await prisma.post.findFirst({ where: { slug, id: { not: params.id } } })) {
      slug = `${base}-${suffix++}`;
    }
  }

  // Handle tag updates
  if (tagIds !== undefined) {
    await prisma.postTag.deleteMany({ where: { postId: params.id } });
  }

  const publishedAt = rest.published && !existing.publishedAt ? new Date() : existing.publishedAt;

  const post = await prisma.post.update({
    where: { id: params.id },
    data: {
      ...(title ? { title, slug } : {}),
      ...rest,
      publishedAt,
      aiSummary: rest.content ? null : undefined, // Invalidate cached summary on content change
      ...(tagIds !== undefined ? {
        tags: { create: tagIds.map(tagId => ({ tagId })) },
      } : {}),
    },
    include: POST_INCLUDE,
  });

  return NextResponse.json({
    ...post,
    tags: (post as any).tags.map((pt: any) => pt.tag),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if ((session.user as any).role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const post = await prisma.post.findUnique({ where: { id: params.id } });
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.post.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
