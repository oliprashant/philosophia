'use client';
// src/components/blog/UpvoteButton.tsx
import { useState } from 'react';
import { ArrowUpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function UpvoteButton({
  postId, initialCount, initialState,
}: { postId: string; initialCount: number; initialState: boolean }) {
  const [count, setCount] = useState(initialCount);
  const [upvoted, setUpvoted] = useState(initialState);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);

    const wasUpvoted = upvoted;
    setUpvoted(!wasUpvoted);
    setCount(c => wasUpvoted ? c - 1 : c + 1);

    try {
      const res = await fetch('/api/upvotes', {
        method: wasUpvoted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setUpvoted(wasUpvoted);
      setCount(c => wasUpvoted ? c + 1 : c - 1);
      toast.error('Could not register vote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-label={upvoted ? 'Remove upvote' : 'Upvote this post'}
      aria-pressed={upvoted}
      className={`
        flex items-center gap-2 px-4 py-1.5 text-sm font-sans border transition-all duration-200
        ${upvoted
          ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10'
          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        }
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
    >
      <ArrowUpCircle size={15} className={upvoted ? 'fill-[var(--accent)] text-[var(--accent)]' : ''} />
      <span>{count}</span>
    </button>
  );
}
