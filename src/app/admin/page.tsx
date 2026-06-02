'use client';

import Link from 'next/link';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminPage() {
  const { user, loading, signInWithGoogle, logOut } = useAuth();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading protected admin area...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <ShieldCheck className="h-5 w-5" />
            <h1 className="text-2xl font-semibold">Admin access</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Sign in with Google to view the protected admin area.
          </p>
          <Link
            href="/auth/signin"
            className="inline-flex rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
          >
            Sign in
          </Link>
        </div>
        <Link href="/" className="text-sm text-[var(--accent)] hover:underline">
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
      <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
        <div className="flex items-center gap-3 text-[var(--text-primary)]">
          <ShieldCheck className="h-5 w-5" />
          <h1 className="text-2xl font-semibold">Protected admin area</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Signed in as <span className="font-medium text-[var(--text-primary)]">{user.displayName || user.email}</span>.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          This page is now guarded only on the client side, matching the simplified Firebase-only auth flow.
        </p>
        <button
          type="button"
          onClick={() => void logOut()}
          className="rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
