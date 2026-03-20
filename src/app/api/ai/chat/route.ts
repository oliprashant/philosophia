// src/app/api/ai/chat/route.ts
// Handles AI assistant chat requests.
// Passes conversation history + page context to OpenAI.

import { NextRequest, NextResponse } from 'next/server';
import { chatWithAssistant, type ChatMessage } from '@/lib/openai';

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'missing') {
    return NextResponse.json({ error: 'AI features are not configured.' }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { messages, context } = body as {
      messages: ChatMessage[];
      context?: { postTitle?: string; postExcerpt?: string };
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Limit history to last 20 messages to keep token usage reasonable
    const trimmed = messages.slice(-20);

    const reply = await chatWithAssistant(trimmed, context);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[AI Chat]', err);
    return NextResponse.json({ error: 'Chat unavailable' }, { status: 500 });
  }
}
