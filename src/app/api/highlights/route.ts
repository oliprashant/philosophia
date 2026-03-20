// src/app/api/highlights/route.ts
// POST /api/highlights → save a highlight (auth required)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  postId: z.string(),
  text: z.string().min(1).max(2000),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Login required to save highlights' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  try {
    const highlight = await prisma.highlight.create({
      data: { ...parsed.data, userId: (session.user as any).id },
    });
    return NextResponse.json({ id: highlight.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}
