'use client';

import Link from 'next/link';
import FirebaseSignIn from '@/components/auth/FirebaseSignIn';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-16">
      <div className="mx-auto grid w-full max-w-4xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-sans">Sign in</p>
            <h1
              className="mt-3 text-4xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Welcome back to Philosophia
            </h1>
            <p className="mt-3 max-w-xl text-sm text-[var(--text-muted)] font-sans leading-relaxed">
              Use Google for Firebase-backed sign-in, or continue with your native account flow if you already
              registered by email.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-sm border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
            >
              Create native account
            </Link>
            <Link
              href="/auth/forgot-password"
              className="inline-flex items-center justify-center rounded-sm border border-[var(--border)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-secondary)]"
            >
              Recover password
            </Link>
          </div>

          <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-muted)]">
            If the same email exists in both systems, your profile will be unified in the database.
          </div>
        </div>

        <div className="w-full self-center">
          <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Philosophia
            </h1>
          </Link>
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Continue with Google</p>
        </div>

          <div className="border border-[var(--border)] p-8 bg-[var(--bg-primary)] space-y-4">
            <FirebaseSignIn />
            <p className="text-center text-sm font-sans text-[var(--text-muted)]">
              Google sign-in creates or reuses your Firebase account automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}