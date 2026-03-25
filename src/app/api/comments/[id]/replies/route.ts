// src/app/api/comments/[id]/replies/route.ts
// GET /api/comments/[id]/replies → Fetch nested replies for a specific comment

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const depth = Math.min(parseInt(new URL(req.url).searchParams.get('depth') || '2'), 3);

    // Fetch the comment with nested replies
    const comment = await prisma.comment.findUnique({
      where: { id: params.id },
      include: {
        replies: {
          where: { deleted: false },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, image: true, bio: true, role: true } },
            _count: { select: { upvotes: true, replies: true } },
            // Stop at N levels to prevent infinite nesting
            ...(depth > 1 && {
              replies: {
                where: { deleted: false },
                orderBy: { createdAt: 'asc' },
                include: {
                  author: { select: { id: true, name: true, image: true, bio: true, role: true } },
                  _count: { select: { upvotes: true, replies: true } },
                  // Level 3
                  ...(depth > 2 && {
                    replies: {
                      where: { deleted: false },
                      orderBy: { createdAt: 'asc' },
                      include: {
                        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
                        _count: { select: { upvotes: true, replies: true } },
                      },
                    },
                  }),
                },
              },
            }),
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const serialize = (c: any): any => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      replies: c.replies?.map(serialize) ?? [],
    });

    return NextResponse.json({
      replies: comment.replies?.map(serialize) ?? [],
    });
  } catch (err) {
    console.error('[Comments Replies GET]', err);
    return NextResponse.json({ error: 'Failed to load replies' }, { status: 500 });
  }
}
