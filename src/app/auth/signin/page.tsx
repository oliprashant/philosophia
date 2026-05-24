'use client';

import Link from 'next/link';
import FirebaseSignIn from '@/components/auth/FirebaseSignIn';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Philosophia
            </h1>
          </Link>
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Sign in with Google to continue</p>
        </div>

        <div className="border border-[var(--border)] p-8 bg-[var(--bg-primary)] space-y-4">
          <FirebaseSignIn />
          <p className="text-center text-sm font-sans text-[var(--text-muted)]">
            Google sign-in creates or reuses your Firebase account automatically.
          </p>
        </div>
      </div>
    </div>
  );
}