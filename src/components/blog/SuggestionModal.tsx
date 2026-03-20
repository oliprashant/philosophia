'use client';
// src/components/blog/SuggestionModal.tsx
// Allows any user (logged in or not) to suggest an edit to a post.
// Submissions go into the Suggestion table with PENDING status for admin review.

import { useState } from 'react';
import { Edit3, X, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SuggestionModal({ postId, userId }: { postId: string; userId: string | null }) {
  const [open, setOpen] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [suggestedText, setSuggestedText] = useState('');
  const [reason, setReason] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestedText.trim()) return;
    setState('loading');
    try {
      const res = await fetch('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, originalText, suggestedText, reason, guestName, guestEmail }),
      });
      if (!res.ok) throw new Error();
      setState('success');
      setTimeout(() => { setOpen(false); setState('idle'); }, 2500);
    } catch {
      toast.error('Could not submit suggestion');
      setState('idle');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-sans border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors rounded-sm"
      >
        <Edit3 size={14} /> Suggest Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Suggest edit">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-card max-w-lg w-full p-8 animate-slide-up">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[var(--text-faint)] hover:text-[var(--text-primary)]" aria-label="Close">
              <X size={18} />
            </button>

            {state === 'success' ? (
              <div className="text-center py-8">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>Suggestion Received</h3>
                <p className="text-sm font-sans text-[var(--text-muted)]">Thank you. Our editors will review your suggestion.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-6" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  <Edit3 size={18} className="inline mr-2 text-[var(--accent)]" />
                  Suggest an Edit
                </h3>
                <form onSubmit={submit} className="space-y-4">
                  {!userId && (
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="Your name" value={guestName} onChange={e => setGuestName(e.target.value)}
                        className="px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]" />
                      <input type="email" placeholder="Email (optional)" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                        className="px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                      Original text (optional)
                    </label>
                    <textarea value={originalText} onChange={e => setOriginalText(e.target.value)} rows={2}
                      placeholder="Paste the text you'd like to change…"
                      className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                      Suggested replacement *
                    </label>
                    <textarea value={suggestedText} onChange={e => setSuggestedText(e.target.value)} rows={3} required
                      placeholder="What should it say instead?"
                      className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] resize-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">
                      Reason
                    </label>
                    <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="e.g. factual error, grammatical issue…"
                      className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                      Cancel
                    </button>
                    <button type="submit" disabled={state === 'loading' || !suggestedText.trim()}
                      className="px-6 py-2 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-40 transition-colors flex items-center gap-2">
                      {state === 'loading' ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : 'Submit Suggestion'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
