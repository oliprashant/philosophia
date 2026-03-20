'use client';
// src/hooks/useReadingMode.tsx
// React context + hook for reading mode state and highlight management.
// Wraps the article page so ReadingToolbar and ArticleContent share state.

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

export const HIGHLIGHT_COLORS = [
  { id: 'yellow', label: 'Yellow',  hex: '#FFEC64', className: 'highlight-yellow' },
  { id: 'blue',   label: 'Blue',    hex: '#64B4FF', className: 'highlight-blue'   },
  { id: 'red',    label: 'Red',     hex: '#FF6464', className: 'highlight-red'    },
  { id: 'green',  label: 'Green',   hex: '#64DC82', className: 'highlight-green'  },
  { id: 'purple', label: 'Purple',  hex: '#B464FF', className: 'highlight-purple' },
];

export interface HighlightItem {
  id?: string;
  text: string;
  color: string;  // hex
  startOffset: number;
  endOffset: number;
}

interface ReadingModeContextValue {
  readingMode: boolean;
  toggleReadingMode: () => void;
  highlights: HighlightItem[];
  addHighlight: (h: Omit<HighlightItem, 'id'>) => void;
  removeHighlight: (id: string) => void;
  activeColor: string;
  setActiveColor: (c: string) => void;
  paintMode: boolean;
  togglePaintMode: () => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (s: 'normal' | 'large' | 'xlarge') => void;
}

const ReadingModeContext = createContext<ReadingModeContextValue | null>(null);

export function ReadingModeProvider({
  children,
  postId,
  userId,
  initialHighlights = [],
}: {
  children: ReactNode;
  postId: string;
  userId: string | null;
  initialHighlights?: HighlightItem[];
}) {
  const [readingMode, setReadingMode] = useState(false);
  const [highlights, setHighlights] = useState<HighlightItem[]>(initialHighlights);
  const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[0].hex);
  const [paintMode, setPaintMode] = useState(false);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');

  const toggleReadingMode = useCallback(() => {
    setReadingMode(prev => !prev);
  }, []);

  const addHighlight = useCallback(async (h: Omit<HighlightItem, 'id'>) => {
    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    setHighlights(prev => [...prev, { ...h, id: tempId }]);

    if (!userId) {
      // Not logged in – store in localStorage
      try {
        const stored = JSON.parse(localStorage.getItem(`highlights-${postId}`) || '[]');
        stored.push({ ...h, id: tempId });
        localStorage.setItem(`highlights-${postId}`, JSON.stringify(stored));
      } catch {}
      return;
    }

    // Persist to server
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, ...h }),
      });
      const data = await res.json();
      // Replace temp id with server id
      setHighlights(prev => prev.map(item => item.id === tempId ? { ...item, id: data.id } : item));
    } catch {
      toast.error('Could not save highlight');
    }
  }, [postId, userId]);

  const removeHighlight = useCallback(async (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));

    if (userId) {
      await fetch(`/api/highlights/${id}`, { method: 'DELETE' }).catch(() => {});
    }
  }, [userId]);

  const togglePaintMode = useCallback(() => setPaintMode(prev => !prev), []);

  return (
    <ReadingModeContext.Provider value={{
      readingMode, toggleReadingMode,
      highlights, addHighlight, removeHighlight,
      activeColor, setActiveColor,
      paintMode, togglePaintMode,
      fontSize, setFontSize,
    }}>
      {/* Apply CSS variables based on font size */}
      <div
        style={{
          ['--reading-size' as string]:
            fontSize === 'xlarge' ? '1.3rem' :
            fontSize === 'large'  ? '1.2rem' : '1.125rem',
        }}
      >
        {children}
      </div>
    </ReadingModeContext.Provider>
  );
}

export function useReadingMode() {
  const ctx = useContext(ReadingModeContext);
  if (!ctx) throw new Error('useReadingMode must be used within ReadingModeProvider');
  return ctx;
}
