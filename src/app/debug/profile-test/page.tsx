'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileDebugPage() {
  const router = useRouter();
  const { user, loading, signInWithGoogle } = useAuth();

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-3xl font-bold">Firebase Auth Debug</h1>

      <div className="space-y-4 p-4 border border-[var(--border)] rounded bg-[var(--bg-secondary)]">
        <p className="font-bold">Loading: <code className="bg-[var(--bg-primary)] px-2 py-1">{String(loading)}</code></p>
        <p className="font-bold">User:</p>
        <pre className="bg-[var(--bg-primary)] p-2 border border-[var(--border)] rounded text-sm overflow-auto">
          {user ? JSON.stringify({ name: user.displayName, email: user.email, photoURL: user.photoURL }, null, 2) : 'No Firebase user'}
        </pre>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="rounded-sm bg-[var(--text-primary)] px-4 py-2 text-[var(--bg-primary)]"
          >
            Sign in with Google
          </button>

          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="rounded-sm border border-[var(--border)] px-4 py-2"
          >
            Go to profile
          </button>
        </div>
      </div>
    </div>
  );
}
