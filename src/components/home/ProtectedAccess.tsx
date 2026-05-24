"use client";

import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedAccess() {
  const { user, loading, signInWithGoogle, logOut } = useAuth();

  if (loading) {
    return (
      <section className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6">
        <div className="flex items-center gap-3 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking sign-in state...
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Members only</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Sign in with Google to unlock the protected section of the homepage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void signInWithGoogle()}
          className="rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
        >
          Sign in with Google
        </button>
      </section>
    );
  }

  return (
    <section className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt={user.displayName || 'Signed in user'}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)] text-sm font-semibold text-[var(--text-primary)]">
            {(user.displayName || user.email || '?').slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{user.displayName || 'Google user'}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
        </div>
      </div>

      <div className="rounded border border-dashed border-[var(--border)] p-4">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Protected content</p>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          This block is only visible when Firebase Auth reports a signed-in user.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void logOut()}
        className="rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-primary)]"
      >
        Sign Out
      </button>
    </section>
  );
}