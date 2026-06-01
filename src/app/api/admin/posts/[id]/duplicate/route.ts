import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasAdminAccess } from '@/lib/admin-auth';
import { POST_INCLUDE, ensureUniqueSlug, serializePost } from '@/lib/admin-posts';

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: { tags: true },
  });

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const title = `Copy of ${post.title}`;
  const slug = await ensureUniqueSlug(title);

  const duplicate = await prisma.post.create({
    data: {
      title,
      slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      coverAlt: post.coverAlt,
      status: 'DRAFT',
      published: false,
      featured: false,
      genre: post.genre,
      readingTime: post.readingTime,
      authorId: post.authorId,
      categoryId: post.categoryId,
      humourId: post.humourId,
      aiSummary: post.aiSummary,
      tags: post.tags.length ? { create: post.tags.map(tag => ({ tagId: tag.tagId })) } : undefined,
    },
    include: POST_INCLUDE,
  });

  return NextResponse.json({ success: true, post: serializePost(duplicate) }, { status: 201 });
}
