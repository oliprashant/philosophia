// src/app/api/posts/[id]/summarize/route.ts
// Generates an AI summary for a post.
// Checks for a cached summary first; if none, generates and caches one.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { summarizePost } from '@/lib/openai';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'missing') {
    return NextResponse.json({ error: 'AI features are not configured.' }, { status: 503 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: params.id, published: true },
      select: { id: true, title: true, content: true, aiSummary: true },
    });

    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Return cached summary if it already exists
    if (post.aiSummary) {
      return NextResponse.json({ summary: post.aiSummary });
    }

    // Generate new summary
    const summary = await summarizePost(post.title, post.content);

    // Cache in database (fire-and-forget)
    prisma.post.update({ where: { id: post.id }, data: { aiSummary: summary } }).catch(console.error);

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error('[Summarize]', err);
    return NextResponse.json({ error: 'Summarization failed' }, { status: 500 });
  }
}
