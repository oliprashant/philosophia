'use client';

import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md border border-[var(--border)] bg-[var(--bg-primary)] p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
          Google sign-in only
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Account creation happens automatically the first time you sign in with Google.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
        >
          Go to sign in
        </Link>
      </div>
    </div>
  );
}
