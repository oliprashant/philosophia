'use client';
// src/components/blog/SaveButton.tsx

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SaveButton({
  postId,
  initialState = false,
}: { postId: string; initialState?: boolean }) {
  const [saved, setSaved] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    const wasSaved = saved;
    setSaved(!wasSaved);

    try {
      const res = await fetch(
        wasSaved
          ? `/api/saved-posts?postId=${postId}`
          : '/api/saved-posts',
        {
          method: wasSaved ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          ...(wasSaved ? {} : { body: JSON.stringify({ postId }) }),
        }
      );

      if (!res.ok) {
        // If 409 (already saved), just update state
        if (res.status === 409) {
          setSaved(true);
          return;
        }
        throw new Error();
      }
    } catch {
      // Revert
      setSaved(wasSaved);
      toast.error(wasSaved ? 'Could not unsave post' : 'Could not save post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from saved' : 'Save this post'}
      aria-pressed={saved}
      className={`
        flex items-center gap-2 px-4 py-1.5 text-sm font-sans border transition-all duration-200
        ${
          saved
            ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
            : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
    >
      <Bookmark
        size={15}
        className={saved ? 'fill-[var(--accent)] text-[var(--accent)]' : ''}
      />
      <span>{saved ? 'Saved' : 'Save'}</span>
    </button>
  );
}
