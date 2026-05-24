'use client';

import Image from 'next/image';
import { Loader2, Shield, User, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProfilePage() {
  const { user, loading, signInWithGoogle, logOut } = useAuth();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 space-y-4">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <Shield className="h-5 w-5" />
            <h1 className="text-2xl font-semibold">Profile</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Sign in with Google to see your local profile information.
          </p>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-6">
      <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <Image src={user.photoURL} alt={user.displayName || 'User'} width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-primary)] text-lg font-semibold text-[var(--text-primary)]">
              {(user.displayName || user.email || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{user.displayName || 'Google user'}</h1>
            <p className="text-sm text-[var(--text-muted)]">Client-side Firebase profile</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex items-center gap-3">
            <User className="h-4 w-4 text-[var(--accent)]" />
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--text-faint)]">Name</p>
              <p className="text-sm text-[var(--text-primary)]">{user.displayName || '—'}</p>
            </div>
          </div>
          <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4 flex items-center gap-3">
            <Mail className="h-4 w-4 text-[var(--accent)]" />
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--text-faint)]">Email</p>
              <p className="text-sm text-[var(--text-primary)]">{user.email || '—'}</p>
            </div>
          </div>
        </div>

        <div className="rounded border border-dashed border-[var(--border)] p-4 text-sm text-[var(--text-muted)]">
          This profile page now uses Firebase client auth only. No server session is involved.
        </div>

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
