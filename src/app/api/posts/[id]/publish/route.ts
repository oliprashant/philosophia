import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasAdminAccess } from '@/lib/admin-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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
      success: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status }
  );
}

function errorDetails(error: unknown) {
  if (error instanceof Error) return error.stack || error.message;
  return String(error);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    const adminAccess = await hasAdminAccess();
    if (!session?.user && !adminAccess) return jsonError('Admin session missing', 401);

    const role = (session?.user as any)?.role as string | undefined;
    const userId = (session?.user as any)?.id as string | undefined;
    if (!adminAccess && role !== 'ADMIN' && role !== 'AUTHOR') return jsonError('Forbidden', 403, 'Admin access is required');

    const post = await prisma.post.findUnique({ where: { id: params.id } });
    if (!post) return jsonError('Not found', 404, `Post ${params.id} does not exist`);
    if (!adminAccess && role === 'AUTHOR' && post.authorId !== userId) return jsonError('Forbidden', 403, 'You can only publish your own posts');

    let body: unknown;
    try {
      body = await req.json();
    } catch (error) {
      console.error('[Publish PATCH] Failed to parse request body', error);
      return jsonError('Invalid JSON body', 400, errorDetails(error));
    }

    if (!body || typeof body !== 'object') {
      return jsonError('Invalid publish data', 400, 'Request body is missing or invalid');
    }

    const rawBody = body as Record<string, unknown>;
    const hasTitle = typeof rawBody.title === 'string' && rawBody.title.trim().length > 0;
    const hasContent = typeof rawBody.content === 'string' && rawBody.content.trim().length > 0;
    const hasCategoryId = Object.prototype.hasOwnProperty.call(rawBody, 'categoryId');

    if (!hasTitle || !hasContent) {
      return jsonError('Missing required fields', 400, !hasTitle ? 'title is required' : 'content is required');
    }

    const effectiveCategoryId = hasCategoryId ? rawBody.categoryId : post.categoryId;
    if (effectiveCategoryId === undefined || effectiveCategoryId === null || effectiveCategoryId === '') {
      return jsonError('Missing required fields', 400, 'categoryId is required. Send "None" to publish without a category.');
    }

    const parsed = publishSchema.safeParse({
      ...rawBody,
      categoryId: effectiveCategoryId,
    });
    if (!parsed.success) {
      return jsonError('Invalid publish data', 400, parsed.error.flatten());
    }

    const { categoryId, title, content, slug, excerpt, coverImage, coverAlt, genre, humourId, featured } = parsed.data;
    const normalizedCategoryId = categoryId && categoryId !== 'None' ? categoryId : null;

    try {
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
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('[Publish PATCH] Prisma known request error', {
          code: error.code,
          meta: error.meta,
          message: error.message,
          stack: error.stack,
        });

        if (error.code === 'P2003') {
          return jsonError('Invalid category', 400, 'The selected category does not exist. Choose a valid category or select None.');
        }

        if (error.code === 'P2025') {
          return jsonError('Post not found', 404, 'The post could not be updated because it no longer exists.');
        }

        return jsonError('Database error', 500, `${error.code}: ${error.message}`);
      }

      if (error instanceof Prisma.PrismaClientInitializationError || error instanceof Prisma.PrismaClientRustPanicError) {
        console.error('[Publish PATCH] Prisma connection error', error);
        return jsonError('Database connection error', 500, errorDetails(error));
      }

      console.error('[Publish PATCH] Update failed', error);
      return jsonError('Could not publish post', 500, errorDetails(error));
    }
  } catch (error) {
    console.error('[Publish PATCH] Unhandled error', error);
    return jsonError('Could not publish post', 500, errorDetails(error));
  }
}
