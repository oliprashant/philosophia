// src/app/api/upvotes/route.ts
// POST   /api/upvotes  → add an upvote (post or comment)
// DELETE /api/upvotes  → remove an upvote
// Anonymous users are tracked by IP address (one vote per IP per post).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
}).refine(d => d.postId || d.commentId, { message: 'postId or commentId required' });

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { postId, commentId } = parsed.data;
  const userId = session?.user ? (session.user as any).id as string : null;
  const ip = !userId ? getIP(req) : null;

  // Check for existing upvote
  const existing = postId
    ? await prisma.upvote.findFirst({ where: { OR: [{ userId, postId }, { ipAddress: ip, postId }] } })
    : await prisma.upvote.findFirst({ where: { OR: [{ userId, commentId }, { ipAddress: ip, commentId }] } });

  if (existing) return NextResponse.json({ error: 'Already upvoted' }, { status: 409 });

  try {
    const upvote = await prisma.upvote.create({
      data: { userId, ipAddress: ip, postId: postId ?? null, commentId: commentId ?? null },
    });
    return NextResponse.json({ id: upvote.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Login required to remove upvote' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { postId, commentId } = parsed.data;
  const userId = (session.user as any).id as string;

  try {
    await prisma.upvote.deleteMany({
      where: { userId, postId: postId ?? null, commentId: commentId ?? null },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
