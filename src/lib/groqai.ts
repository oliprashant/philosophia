// src/lib/openai.ts
// AI utilities using Groq (free, fast inference).
// Groq's API is OpenAI-compatible — models run on custom LPU hardware.
// Free tier: ~14,400 requests/day on llama-3.3-70b

import Groq from 'groq-sdk';

// ── Client ─────────────────────────────────────────────────────────────────────
if (!process.env.GROQ_API_KEY) {
  console.warn('[Groq] GROQ_API_KEY is not set – AI features will be disabled.');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'missing',
});

// ── Best free Groq models (pick one) ──────────────────────────────────────────
// llama-3.3-70b-versatile  → best quality, good for summaries + chat
// llama-3.1-8b-instant     → fastest, use if you hit rate limits
// mixtral-8x7b-32768       → large context window (32k tokens)

const CHAT_MODEL    = 'llama-3.3-70b-versatile';
const SUMMARY_MODEL = 'llama-3.3-70b-versatile';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ── Summarize a post ───────────────────────────────────────────────────────────
export async function summarizePost(title: string, content: string): Promise<string> {
  // Strip HTML tags and cap at 6000 chars to stay within token limits
  const stripped = content.replace(/<[^>]*>/g, '').slice(0, 6000);

  const response = await groq.chat.completions.create({
    model: SUMMARY_MODEL,
    max_tokens: 350,
    temperature: 0.7,
    messages: [
      {
        role: 'system',
        content: `You are a philosophical scholar and elegant writer.
Summarize blog posts in a concise, intellectually engaging way that captures both
the argument and the emotional register of the piece. Write 3–4 sentences maximum.
Do not use bullet points. Write as flowing prose. Never start with "This article" or "The author".`,
      },
      {
        role: 'user',
        content: `Title: "${title}"\n\n${stripped}`,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? 'Summary unavailable.';
}

// ── Chat assistant ────────────────────────────────────────────────────────────
export async function chatWithAssistant(
  messages: ChatMessage[],
  context?: { postTitle?: string; postExcerpt?: string }
): Promise<string> {
  const systemPrompt = `You are Logos, the AI philosophical companion of Philosophia — an independent literary
blog dedicated to philosophical inquiry. You are erudite, warm, and Socratic. You enjoy the classics but are
equally at home with contemporary analytic philosophy, continental thought, and Eastern philosophy.

Your role:
1. Help readers understand and engage with posts they are reading.
2. Recommend other posts on the platform when relevant.
3. Discuss philosophical ideas with depth and intellectual humility.
4. Guide new readers through the blog's categories: Ethics, Metaphysics, Existentialism, Epistemology, Aesthetics.
5. Never be preachy. Prefer questions that open thought over answers that close it.

${context?.postTitle ? `The user is currently reading: "${context.postTitle}"` : ''}
${context?.postExcerpt ? `Article excerpt: "${context.postExcerpt}"` : ''}

Keep responses concise (150–200 words) unless the user explicitly asks for depth.`;

  const response = await groq.chat.completions.create({
    model: CHAT_MODEL,
    max_tokens: 500,
    temperature: 0.8,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  });

  return response.choices[0]?.message?.content ?? "I'm unable to respond right now. Please try again.";
}

// ── AI Recommendations ─────────────────────────────────────────────────────────
export async function getAIRecommendations(
  currentPost: { title: string; excerpt: string; tags: string[] },
  candidates: Array<{ id: string; title: string; excerpt: string; tags: string[] }>
): Promise<string[]> {
  if (candidates.length === 0) return [];

  const candidateList = candidates
    .map((c, i) => `${i + 1}. "${c.title}" – ${c.excerpt}`)
    .join('\n');

  try {
    const response = await groq.chat.completions.create({
      model: CHAT_MODEL,
      max_tokens: 60,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are a philosophical librarian. Given a current article and a list of candidates,
respond ONLY with a JSON array of up to 3 numbers (1-indexed) representing the most thematically
related candidates. Example: [2, 5, 1]. No other text whatsoever.`,
        },
        {
          role: 'user',
          content: `Current: "${currentPost.title}" – ${currentPost.excerpt}\n\nCandidates:\n${candidateList}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '[]';
    const indices: number[] = JSON.parse(raw.trim());
    return indices.map(i => candidates[i - 1]?.id).filter(Boolean);
  } catch {
    // Fallback: tag-overlap scoring
    const scored = candidates.map(c => ({
      id: c.id,
      score: c.tags.filter(t => currentPost.tags.includes(t)).length,
    }));
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(c => c.id);
  }
}