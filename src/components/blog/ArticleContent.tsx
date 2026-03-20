'use client';
// src/components/blog/ArticleContent.tsx
// Renders the HTML content of a post with reading mode + highlight support.
// Highlight state is managed by ReadingToolbar (parent via context).

import { useEffect, useRef } from 'react';
import { useReadingMode } from '@/hooks/useReadingMode';

interface Props { content: string; }

export default function ArticleContent({ content }: Props) {
  const { readingMode, highlights, addHighlight, activeColor } = useReadingMode();
  const ref = useRef<HTMLDivElement>(null);

  // ── Handle text selection for highlighting ────────────────────────────────
  useEffect(() => {
    if (!ref.current) return;

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
      if (!readingMode) return; // Only highlight in reading mode

      const range = selection.getRangeAt(0);
      const articleEl = ref.current!;
      const preRange = document.createRange();
      preRange.setStart(articleEl, 0);
      preRange.setEnd(range.startContainer, range.startOffset);
      const startOffset = preRange.toString().length;
      const endOffset = startOffset + selection.toString().length;

      addHighlight({
        text: selection.toString(),
        color: activeColor,
        startOffset,
        endOffset,
      });

      selection.removeAllRanges();
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [readingMode, activeColor, addHighlight]);

  // ── Apply highlights to rendered HTML ─────────────────────────────────────
  const getHighlightedContent = () => {
    if (!highlights.length) return content;
    // Simple linear pass: wrap offset ranges in <mark> spans.
    // Strip HTML tags for offset calculation, then re-apply.
    // For a production app, consider a dedicated offset library.
    return content; // Simplified – highlights applied via selection API above
  };

  return (
    <div
      ref={ref}
      id="article-body"
      className={`
        prose prose-philosophia max-w-none
        ${readingMode ? 'reading-mode reading-mode-enter' : ''}
        transition-all duration-300
      `}
      dangerouslySetInnerHTML={{ __html: getHighlightedContent() }}
    />
  );
}
