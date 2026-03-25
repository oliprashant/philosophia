// src/app/api/saved-posts/route.ts
// POST /api/saved-posts → save a post
// DELETE /api/saved-posts?postId=xxx → unsave a post

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { postId } = body;

  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 });
  }

  // Verify post exists and is published
  const post = await prisma.post.findUnique({
    where: { id: postId, published: true },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  try {
    // Check if already saved
    const existing = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Post already saved' }, { status: 409 });
    }

    // Create save record
    await prisma.savedPost.create({
      data: { userId, postId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[Saved Posts POST]', err);
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get('postId');

  if (!postId) {
    return NextResponse.json({ error: 'postId required' }, { status: 400 });
  }

  try {
    // Delete save record
    await prisma.savedPost.delete({
      where: { userId_postId: { userId, postId } },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Saved Posts DELETE]', err);
    return NextResponse.json({ error: 'Failed to unsave post' }, { status: 500 });
  }
}
