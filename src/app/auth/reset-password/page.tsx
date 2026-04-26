'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [checkingRecovery, setCheckingRecovery] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirectIn, setRedirectIn] = useState(2);

  useEffect(() => {
    let cancelled = false;

    const setupRecoverySession = async () => {
      try {
        const supabase = getSupabaseBrowserClient();

        // For PKCE-based recovery links, Supabase sends a `code` query param.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!cancelled && data.session?.access_token && data.session.user?.email) {
          setAccessToken(data.session.access_token);
          setRecoveryReady(true);
        }
      } catch {
        if (!cancelled) {
          setRecoveryReady(false);
        }
      } finally {
        if (!cancelled) {
          setCheckingRecovery(false);
        }
      }
    };

    setupRecoverySession();

    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!success) return;

    const interval = setInterval(() => {
      setRedirectIn(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push('/auth/signin');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [success, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recoveryReady || !accessToken) {
      toast.error('Invalid or expired recovery link');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { error: supabaseError } = await supabase.auth.updateUser({
        password,
      });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not reset password');
      }

      await supabase.auth.signOut();

      toast.success('Password reset successful. Redirecting to sign in...');
      setSuccess(true);
      setRedirectIn(2);
    } catch (err: any) {
      toast.error(err.message || 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Philosophia
            </h1>
          </Link>
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Create a new password</p>
        </div>

        <div className="border border-[var(--border)] p-8 bg-[var(--bg-primary)]">
          {checkingRecovery ? (
            <div className="text-center space-y-3">
              <Loader2 size={24} className="mx-auto animate-spin text-[var(--accent)]" />
              <p className="text-sm font-sans text-[var(--text-muted)]">Validating recovery link…</p>
            </div>
          ) : !recoveryReady ? (
            <div className="space-y-4 text-center">
              <p className="text-sm font-sans text-red-600">This password reset link is invalid or expired.</p>
              <Link href="/auth/forgot-password" className="text-sm font-sans text-[var(--accent)] hover:underline">
                Request a new reset link
              </Link>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <p className="text-sm font-sans text-[var(--text-muted)]">
                Your password has been reset successfully.
              </p>
              <p className="text-xs font-sans text-[var(--text-faint)]">
                Redirecting to sign in in {redirectIn}s...
              </p>
              <Link href="/auth/signin" className="text-sm font-sans text-[var(--accent)] hover:underline">
                Go now
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">New Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="At least 8 characters"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-10 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="Repeat your new password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={15} className="animate-spin" /> Resetting…</> : 'Reset Password'}
                </button>
              </form>

              <p className="text-center text-sm font-sans text-[var(--text-muted)] mt-6">
                <Link href="/auth/signin" className="text-[var(--accent)] hover:underline">Back to sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
