"use client";

import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

function getFriendlyAuthError(error: unknown) {
  const code = (error as { code?: string })?.code || '';

  if (code === 'auth/popup-closed-by-user') return 'The Google sign-in popup was closed before completion.';
  if (code === 'auth/cancelled-popup-request') return 'A Google sign-in request is already in progress.';
  if (code === 'auth/network-request-failed') return 'Network error while contacting Firebase. Check your connection.';
  if (code === 'auth/unauthorized-domain') return 'This domain is not authorized in Firebase Authentication settings.';

  return (error as { message?: string })?.message || 'Unable to sign in with Google.';
}

export default function FirebaseSignIn() {
  const { user, loading, signInWithGoogle, logOut } = useAuth();
  const [message, setMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setMessage(null);
      await signInWithGoogle();
    } catch (error) {
      setMessage(getFriendlyAuthError(error));
    }
  };

  const handleSignOut = async () => {
    try {
      setMessage(null);
      await logOut();
    } catch (error) {
      setMessage(getFriendlyAuthError(error));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking Firebase session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-4">
        {message ? (
          <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-muted)]">
            {message}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSignIn}
          className="w-full rounded-sm border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
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

      {message ? (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-muted)]">
          {message}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSignOut}
        className="rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
      >
        Sign Out
      </button>
    </div>
  );
}
