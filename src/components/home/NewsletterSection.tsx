'use client';
// src/components/home/NewsletterSection.tsx
import { useState } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setState('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Subscription failed');
      }
      setState('success');
    } catch (err: any) {
      setError(err.message);
      setState('error');
    }
  };

  return (
    <section
      id="newsletter"
      className="relative border border-[var(--border)] p-10 md:p-16 text-center overflow-hidden"
    >
      {/* Decorative */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--text-primary) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative">
        <span className="text-[var(--gold)] text-2xl mb-4 block">✦</span>
        <h2 className="section-title mb-3">The Weekly Dispatch</h2>
        <p className="text-[var(--text-muted)] max-w-md mx-auto mb-8 font-sans text-sm leading-relaxed">
          One carefully chosen essay, delivered to your inbox each Sunday. No noise, no notifications —
          just philosophy worth your time.
        </p>

        {state === 'success' ? (
          <div className="flex items-center justify-center gap-3 text-green-600 dark:text-green-400">
            <CheckCircle size={20} />
            <span className="font-sans font-medium">You're subscribed. Welcome to the conversation.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
            <div className="relative flex-1 w-full">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full pl-10 pr-4 py-3 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                aria-label="Email address"
              />
            </div>
            <button
              type="submit" disabled={state === 'loading'}
              className="w-full sm:w-auto px-6 py-3 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
            >
              {state === 'loading' ? <><Loader2 size={14} className="animate-spin" /> Subscribing…</> : 'Subscribe'}
            </button>
          </form>
        )}
        {state === 'error' && (
          <p className="text-red-500 text-sm font-sans mt-2">{error}</p>
        )}
        <p className="text-xs text-[var(--text-faint)] font-sans mt-4">No spam. Unsubscribe at any time.</p>
      </div>
    </section>
  );
}
