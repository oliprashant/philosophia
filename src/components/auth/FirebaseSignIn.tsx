"use client";

import { useMemo, useState } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut as signOutFirebase } from 'firebase/auth';
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFirebaseAuth } from '../../lib/firebase-config';

function getFriendlyAuthError(error: unknown) {
  const code = (error as { code?: string })?.code || '';

  if (code === 'auth/popup-closed-by-user') return 'The Google sign-in popup was closed before completion.';
  if (code === 'auth/cancelled-popup-request') return 'A Google sign-in request is already in progress.';
  if (code === 'auth/network-request-failed') return 'Network error while contacting Firebase. Check your connection.';
  if (code === 'auth/unauthorized-domain') return 'This domain is not authorized in Firebase Authentication settings.';

  return (error as { message?: string })?.message || 'Unable to sign in with Google.';
}

export default function FirebaseSignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [exchangeState, setExchangeState] = useState<'idle' | 'checking' | 'synced' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const profileImage = useMemo(() => session?.user?.image || '', [session?.user?.image]);

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setExchangeState('checking');

      const firebaseAuth = getFirebaseAuth();

      if (!firebaseAuth) {
        setExchangeState('error');
        setMessage('Firebase config is missing. Add the NEXT_PUBLIC_FIREBASE_* env vars first.');
        return;
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const credential = await signInWithPopup(firebaseAuth, provider);
      const idToken = await credential.user.getIdToken();

      const exchangeResponse = await fetch('/api/auth/firebase-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      if (exchangeResponse.status === 501) {
        const payload = await exchangeResponse.json().catch(() => ({}));
        setExchangeState('error');
        setMessage(payload?.error || 'Server token exchange is not configured yet.');
        return;
      }

      if (!exchangeResponse.ok) {
        const payload = await exchangeResponse.json().catch(() => ({}));
        setExchangeState('error');
        setMessage(payload?.error || exchangeResponse.statusText || 'Failed to verify Firebase login.');
        return;
      }

      const result = await nextAuthSignIn('firebase', {
        idToken,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setExchangeState('error');
        setMessage(
          result.error === 'CredentialsSignin'
            ? 'Server token exchange is not configured yet. Add FIREBASE_SERVICE_ACCOUNT_KEY to enable this login.'
            : result.error
        );
        return;
      }

      setExchangeState('synced');
      setMessage('Signed in successfully.');
      router.replace(result?.url || callbackUrl);
      router.refresh();
    } catch (error) {
      setExchangeState('error');
      setMessage(getFriendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const firebaseAuth = getFirebaseAuth();

      await Promise.all([
        nextAuthSignOut({ redirect: false, callbackUrl: '/auth/signin' }),
        firebaseAuth ? signOutFirebase(firebaseAuth) : Promise.resolve(),
      ]);

      setExchangeState('idle');
      setMessage('Signed out.');
      router.refresh();
    } catch (error) {
      setMessage((error as { message?: string })?.message || 'Unable to sign out.');
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'authenticated') {
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
          disabled={loading}
          className="w-full rounded-sm border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex items-center gap-3">
        {profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profileImage} alt={session.user?.name || 'Signed in user'} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)] text-sm font-semibold text-[var(--text-primary)]">
            {(session.user?.name || session.user?.email || '?').slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{session.user?.name || 'Google user'}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">{session.user?.email}</p>
        </div>
      </div>

      {message ? (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-muted)]">
          {message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={loading}
          className="rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)] disabled:opacity-60"
        >
          {loading ? 'Signing out…' : 'Sign Out'}
        </button>

        <div className="rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text-muted)]">
          Status: {exchangeState}
        </div>
      </div>

      <div className="rounded border border-dashed border-[var(--border)] p-4">
        <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Protected content</p>
        <p className="text-sm text-[var(--text-muted)]">
          This content is visible only after Firebase sign-in succeeds.
        </p>
      </div>
    </div>
  );
}
