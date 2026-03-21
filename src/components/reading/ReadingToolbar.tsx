'use client';
// src/components/reading/ReadingToolbar.tsx
// Sticky sidebar toolbar for reading mode controls:
// - Reading mode toggle
// - Highlight color picker
// - Font size controls
// - Paint canvas toggle

import { useState } from 'react';
import { BookOpen, Pen, Minus, Plus, Palette, X, ChevronRight } from 'lucide-react';
import { ReadingModeProvider, useReadingMode, HIGHLIGHT_COLORS } from '@/hooks/useReadingMode';
import PaintCanvas from './PaintCanvas';
import type { HighlightItem } from '@/hooks/useReadingMode';

// ── Inner toolbar (uses context) ───────────────────────────────────────────────
function Toolbar() {
  const {
    readingMode, toggleReadingMode,
    activeColor, setActiveColor,
    paintMode, togglePaintMode,
    fontSize, setFontSize,
  } = useReadingMode();

  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Floating toolbar button */}
      <div className={`
        fixed left-4 top-1/2 -translate-y-1/2 z-40
        flex flex-col items-center gap-1
        transition-all duration-300
        ${readingMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}>
        {/* Toggle expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-9 h-9 rounded-full bg-[var(--bg-primary)] border border-[var(--border)] shadow-card flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
          aria-label="Reading tools"
        >
          {expanded ? <X size={15} /> : <ChevronRight size={15} />}
        </button>

        {expanded && (
          <div className="flex flex-col gap-1.5 items-center py-2 px-1.5 bg-[var(--bg-primary)] border border-[var(--border)] shadow-card rounded-lg animate-slide-up">
            {/* Highlight colors */}
            <span className="text-[9px] font-sans text-[var(--text-faint)] uppercase tracking-widest mb-1">
              Highlight
            </span>
            {HIGHLIGHT_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveColor(c.hex)}
                title={c.label}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  activeColor === c.hex ? 'border-[var(--text-primary)] scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}

            <div className="h-px w-6 bg-[var(--border)] my-1" />

            {/* Font size */}
            <span className="text-[9px] font-sans text-[var(--text-faint)] uppercase tracking-widest mb-1">
              Size
            </span>
            <button
              onClick={() => setFontSize('normal')}
              className={`w-6 h-6 flex items-center justify-center text-xs font-sans rounded ${fontSize === 'normal' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'}`}
            >
              S
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`w-6 h-6 flex items-center justify-center text-sm font-sans rounded ${fontSize === 'large' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'}`}
            >
              M
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`w-6 h-6 flex items-center justify-center text-base font-sans rounded ${fontSize === 'xlarge' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)]'}`}
            >
              L
            </button>

            <div className="h-px w-6 bg-[var(--border)] my-1" />

            {/* Paint toggle */}
            <button
              onClick={togglePaintMode}
              title="Paint mode"
              className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
                paintMode ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--accent)]'
              }`}
            >
              <Pen size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Reading mode toggle – always visible in top bar area */}
      <div className="fixed bottom-6 left-6 z-40">
        <button
          onClick={toggleReadingMode}
          className={`
            flex items-center gap-2 px-4 py-2 text-sm font-sans rounded-full shadow-card border transition-all duration-300
            ${readingMode
              ? 'bg-[var(--accent)] text-white border-[var(--accent)]'
              : 'bg-[var(--bg-primary)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
            }
          `}
          aria-label={readingMode ? 'Exit reading mode' : 'Enter reading mode'}
        >
          <BookOpen size={15} />
          <span className="hidden sm:inline">{readingMode ? 'Exit Reading' : 'Reading Mode'}</span>
        </button>
      </div>

      {/* Reading mode overlay bg */}
      {readingMode && (
        <div className="fixed inset-0 bg-[var(--reading-bg)] -z-10 transition-opacity duration-300" />
      )}

      {/* Paint canvas overlay */}
      {paintMode && <PaintCanvas />}
    </>
  );
}

// Replace only this bottom section (keep everything above exactly the same)
export default function ReadingToolbar({
  postId,
  userId,
  initialHighlights,
}: {
  postId: string;
  userId: string | null;
  initialHighlights: HighlightItem[];
}) {
  return <Toolbar />; // 👈 removed ReadingModeProvider wrapper
}
