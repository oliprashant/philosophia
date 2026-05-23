'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Try server endpoint first
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        if (res.ok) {
          toast.success("We've sent a password reset link to your email");
          router.push(`/auth/signin?reset=true`);
          return;
        }
        // fallthrough to client-side supabase call
      } catch (err) {
        // server failed — attempt client-side Supabase fallback
      }

      // Fallback: call Supabase directly from the browser
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
      if (error) throw error;

      toast.success("We've sent a password reset link to your email");
      router.push(`/auth/signin?reset=true`);
    } catch {
      toast.error('Could not process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Philosophia
            </h1>
          </Link>
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Forgot your password?</p>
        </div>

        <div className="border border-[var(--border)] rounded-xl p-8 bg-[var(--bg-primary)] shadow-sm">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-sans font-medium rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : 'Send reset link'}
            </button>

            <p className="text-center text-sm font-sans text-[var(--text-muted)] mt-4">
              Remembered your password?{' '}
              <Link href="/auth/signin" className="text-[var(--accent)] hover:underline">Sign in</Link>
            </p>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <Link href="/auth/signin" className="inline-flex items-center gap-2 text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
