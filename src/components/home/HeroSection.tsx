// src/components/home/HeroSection.tsx
export default function HeroSection() {
  return (
    <section className="relative border-b border-[var(--border)] overflow-hidden">
      {/* Decorative background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, var(--text-primary) 39px, var(--text-primary) 40px)`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
        {/* Ornamental line */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="h-px w-16 bg-[var(--gold)]" />
          <span className="text-[var(--gold)] text-xs font-sans uppercase tracking-[0.3em]">Est. 2025</span>
          <div className="h-px w-16 bg-[var(--gold)]" />
        </div>

        <h1
          className="text-6xl md:text-8xl font-bold tracking-tight text-[var(--text-primary)] mb-6"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Philosophia
        </h1>

        <p
          className="text-xl md:text-2xl text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
        >
          A journal of philosophical inquiry, dedicated to the examined life.
          Essays, dialogues, and poems in the pursuit of wisdom.
        </p>

        <div className="flex items-center justify-center gap-6 mt-10">
          <a
            href="/blog"
            className="px-8 py-3 font-sans font-medium text-sm bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] transition-colors tracking-wide"
          >
            Begin Reading
          </a>
          <a
            href="/about"
            className="px-8 py-3 font-sans font-medium text-sm border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors tracking-wide"
          >
            Our Philosophy
          </a>
        </div>

        {/* Bottom ornament */}
        <div className="flex items-center justify-center gap-4 mt-16">
          <div className="h-px w-8 bg-[var(--border)]" />
          <span className="text-[var(--accent)] text-2xl">✦</span>
          <div className="h-px w-8 bg-[var(--border)]" />
        </div>
      </div>
    </section>
  );
}
