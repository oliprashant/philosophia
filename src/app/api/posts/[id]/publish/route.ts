import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const publishSchema = z.object({
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
});

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) return jsonError('Unauthorized', 401);

    const role = (session.user as any).role as string;
    const userId = (session.user as any).id as string;
    if (!['ADMIN', 'AUTHOR'].includes(role)) return jsonError('Forbidden', 403);

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return jsonError('Not found', 404);
    if (role === 'AUTHOR' && post.authorId !== userId) return jsonError('Forbidden', 403);

    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[Publish PATCH] Failed to parse request body', error);
      return jsonError('Invalid JSON body', 400);
    }

    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError('Invalid publish data', 400, parsed.error.flatten());
    }

    const { categoryId, title, content, slug, excerpt, coverImage, coverAlt, genre, humourId, featured } = parsed.data;
    const normalizedCategoryId = categoryId && categoryId !== 'None' ? categoryId : null;

    const updated = await prisma.post.update({
      where: { id: params.id },
      data: {
        title,
        content,
        ...(slug ? { slug } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, 'excerpt') ? { excerpt: excerpt || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, 'coverImage') ? { coverImage: coverImage || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, 'coverAlt') ? { coverAlt: coverAlt || null } : {}),
        ...(genre ? { genre } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, 'humourId') ? { humourId: humourId || null } : {}),
        ...(Object.prototype.hasOwnProperty.call(parsed.data, 'featured') ? { featured: Boolean(featured) } : {}),
        ...(normalizedCategoryId ? { categoryId: normalizedCategoryId } : { categoryId: null }),
        published: true,
        publishedAt: post.publishedAt ?? new Date(),
      },
      select: { id: true, published: true, publishedAt: true },
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      published: updated.published,
      publishedAt: updated.publishedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error('[Publish PATCH]', error);
    return jsonError('Could not publish post', 500, error instanceof Error ? error.message : String(error));
  }
}
