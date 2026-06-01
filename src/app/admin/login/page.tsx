"use client";

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/admin';
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not sign in');
      }

      toast.success('Admin access granted');
      router.replace(nextPath);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Could not sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4 py-16">
      <div className="w-full max-w-md rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-8 shadow-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-cormorant)' }}>Philosophia</h1>
          </Link>
          <p className="mt-2 text-sm text-[var(--text-faint)]">Admin password required</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
                className="w-full border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="Enter admin password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 bg-[var(--text-primary)] py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)] disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : null}
            Enter admin
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
          Loading...
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
