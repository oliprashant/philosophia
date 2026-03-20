// src/app/api/suggestions/route.ts
// POST /api/suggestions → submit an edit suggestion for admin review

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  postId: z.string().min(1),
  originalText: z.string().max(5000).optional(),
  suggestedText: z.string().min(1).max(5000),
  reason: z.string().max(500).optional(),
  guestName: z.string().max(100).optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { postId, originalText, suggestedText, reason, guestName, guestEmail } = parsed.data;

  const post = await prisma.post.findUnique({ where: { id: postId, published: true }, select: { id: true } });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  try {
    await prisma.suggestion.create({
      data: {
        postId,
        originalText,
        suggestedText,
        reason,
        authorId: session?.user ? (session.user as any).id : null,
        guestName: !session?.user ? guestName ?? null : null,
        guestEmail: !session?.user && guestEmail ? guestEmail : null,
      },
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[Suggestions POST]', err);
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}
