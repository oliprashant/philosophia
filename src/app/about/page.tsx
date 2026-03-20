// src/app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'The philosophy behind Philosophia — a journal dedicated to the examined life.',
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="h-px w-12 bg-[var(--gold)]" />
          <span className="text-[var(--gold)] text-xs font-sans uppercase tracking-[0.3em]">Est. MMX</span>
          <div className="h-px w-12 bg-[var(--gold)]" />
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>
          About Philosophia
        </h1>
        <p className="text-xl text-[var(--text-muted)] italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          A journal dedicated to the examined life.
        </p>
      </div>

      {/* Body */}
      <div className="prose prose-philosophia max-w-none">
        <p>
          Philosophy does not belong to universities. It belongs to the sleepless at 3 a.m., 
          to the grieving and the joyful, to anyone who has stood at the edge of a question 
          and felt the vertiginous pleasure of not knowing the answer.
        </p>
        <p>
          Philosophia was founded on one simple conviction: <strong>ideas want to be alive</strong>. 
          Not archived in footnotes, but argued over coffee, revised in the margins, 
          challenged by a stranger, and returned to—changed—years later.
        </p>

        <h2>What We Publish</h2>
        <p>
          We publish essays, dialogues, poems, and aphorisms across the full range of philosophical 
          inquiry — from ancient questions of ethics and metaphysics to the existentialist 
          literature of the twentieth century and the analytical puzzles of mind and language 
          that occupy us today.
        </p>
        <p>
          We are especially interested in work that crosses disciplinary boundaries: philosophy 
          that reads like literature, science that opens onto wonder, personal essays that 
          discover universal questions in private grief.
        </p>

        <h2>The Four Humours</h2>
        <p>
          We organise our writing according to a custom taxonomy inspired by the ancient theory 
          of the four humours — not as a medical claim, but as a poetic one. Every piece of 
          philosophical writing has a temperament:
        </p>
        <ul>
          <li><strong>Melancholic</strong> — dark, introspective, drawn to the void and the absurd.</li>
          <li><strong>Sanguine</strong> — life-affirming, warm, finding meaning in the ordinary.</li>
          <li><strong>Choleric</strong> — passionate, polemical, burning with intellectual fire.</li>
          <li><strong>Phlegmatic</strong> — calm, systematic, moving toward truth through patient reason.</li>
        </ul>

        <h2>Our Commitment to Open Dialogue</h2>
        <p>
          Every reader may comment, suggest edits, and upvote. We believe the best philosophical 
          writing is not monologue but dialogue. We are permanently in draft. Truth — if it exists — 
          is collaboratively discovered.
        </p>

        <h2>On the AI Companion</h2>
        <p>
          Logos, our AI assistant, is named after the ancient Greek concept of reason and discourse. 
          It can discuss ideas in any piece, recommend further reading, and serve as a Socratic 
          interlocutor. Logos does not replace human dialogue — it makes the silence between 
          readings more productive.
        </p>

        <blockquote>
          "The unexamined life is not worth living." — Socrates, <em>Apology</em>
        </blockquote>

        <p>
          We take this seriously. We also take seriously that the examination never ends, 
          and that its value lies in the asking, not the answering.
        </p>
      </div>

      {/* Ornament */}
      <div className="flex items-center justify-center gap-4 mt-16">
        <div className="h-px w-8 bg-[var(--border)]" />
        <span className="text-[var(--accent)] text-2xl">✦</span>
        <div className="h-px w-8 bg-[var(--border)]" />
      </div>
    </div>
  );
}
