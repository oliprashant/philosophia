// src/app/api/comments/route.ts
// GET  /api/comments?postId=xxx  → paginated threaded comments
// POST /api/comments              → create a new comment (any user)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

// ── GET ────────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');
  const userIdParam = searchParams.get('userId');

  if (userIdParam === 'me') {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id as string;
    const comments = await prisma.comment.findMany({
      where: { authorId: userId, deleted: false },
      orderBy: { createdAt: 'desc' },
      include: {
        post: { select: { id: true, title: true, slug: true } },
      },
      take: 100,
    });

    return NextResponse.json({
      comments: comments.map(c => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        post: c.post,
      })),
    });
  }

  if (!postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  try {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 30;
    const skip = (page - 1) * limit;
    const deleted = searchParams.get('includeDeleted') === 'true';

    // Fetch count for pagination
    const total = await prisma.comment.count({
      where: { postId, parentId: null, ...(deleted ? {} : { deleted: false }) },
    });

    // Fetch only top-level comments (no nested replies yet)
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, ...(deleted ? {} : { deleted: false }) },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        _count: { select: { upvotes: true, replies: true } },
        replies: undefined, // Don't fetch replies yet - use lazy loading
      },
    });

    const serialize = (c: any): any => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      replies: c.replies?.map(serialize) ?? [],
    });

    return NextResponse.json({
      comments: comments.map(serialize),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: page < Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Comments GET]', err);
    return NextResponse.json({ error: 'Failed to load comments' }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────────
const commentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(5000),
  parentId: z.string().nullable().optional(),
  guestName: z.string().max(100).optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();

  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });

  const { postId, content, parentId, guestName, guestEmail } = parsed.data;

  // Anonymous users must supply a name
  if (!session?.user && !guestName) {
    return NextResponse.json({ error: 'Name is required for anonymous comments' }, { status: 400 });
  }

  // Verify post exists
  const post = await prisma.post.findUnique({ where: { id: postId, published: true }, select: { id: true } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        parentId: parentId ?? null,
        authorId: session?.user ? (session.user as any).id : null,
        guestName: !session?.user ? guestName : null,
        guestEmail: !session?.user && guestEmail ? guestEmail : null,
      },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        _count: { select: { upvotes: true } },
        replies: [],
      },
    });

    return NextResponse.json({
      comment: {
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        replies: [],
      },
    }, { status: 201 });
  } catch (err) {
    console.error('[Comments POST]', err);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
