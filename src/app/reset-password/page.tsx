"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function generateStrongPassword(length = 16) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()-_=+[]{}?';
  const all = upper + lower + numbers + symbols;

  const chars = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  for (let i = chars.length; i < length; i += 1) {
    chars.push(all[Math.floor(Math.random() * all.length)]);
  }

  return chars.sort(() => Math.random() - 0.5).join('');
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score >= 5) return { label: 'Very strong', width: '100%', color: 'bg-emerald-500' };
  if (score >= 4) return { label: 'Strong', width: '75%', color: 'bg-emerald-400' };
  if (score >= 3) return { label: 'Okay', width: '50%', color: 'bg-amber-400' };
  return { label: 'Weak', width: '25%', color: 'bg-red-400' };
}

function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();

  // Support token in query params (token, access_token) and in URL fragment (#access_token=...)
  const getTokenFromFragment = () => {
    if (typeof window === 'undefined') return '';
    const hash = window.location.hash || '';
    if (!hash) return '';
    try {
      const qp = new URLSearchParams(hash.replace(/^#/, ''));
      return qp.get('token') || qp.get('access_token') || qp.get('accessToken') || qp.get('recovery_token') || qp.get('oobCode') || '';
    } catch {
      return '';
    }
  };

  let token = params.get('token') || params.get('access_token') || '';
  if (!token && typeof window !== 'undefined') token = getTokenFromFragment();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    // If user landed here without a token, stay on page and show guidance.
    // Don't auto-redirect immediately to allow manual copy-paste flows.
  }, [token]);

  const fillStrongPassword = async () => {
    const generated = generateStrongPassword();
    setPassword(generated);
    setConfirmPassword(generated);
    try {
      await navigator.clipboard.writeText(generated);
      toast.success('Strong password generated and copied');
    } catch {
      toast.success('Strong password generated');
    }
  };

  const copyPassword = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    toast.success('Password copied');
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      toast.error('Missing recovery token. Use the link from your email.');
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
      const refreshToken = sessionStorage.getItem('reset_refresh_token') || undefined;

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password, refreshToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not reset password');
      }

      sessionStorage.removeItem('reset_refresh_token');
      toast.success('Password reset successful');
      router.push('/auth/signin?reset=true');
    } catch (error: any) {
      toast.error(error.message || 'Could not reset password');
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
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Set your new password</p>
        </div>

        <div className="border border-[var(--border)] rounded-xl p-8 bg-[var(--bg-primary)] shadow-sm">
          {!token && (
            <div className="mb-4 text-sm text-[var(--text-faint)]">
              We couldn't find a recovery token in the URL. Please open the password reset link from your email. If that
              doesn't work, request a new reset from the sign-in page.
            </div>
          )}

          <button
            type="button"
            onClick={fillStrongPassword}
            className="w-full mb-4 py-2.5 text-sm font-sans font-medium rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors"
          >
            Generate strong password
          </button>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                  className="w-full px-3 pr-20 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="At least 8 characters"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="p-1.5 text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Copy password"
                  >
                    <Copy size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="p-1.5 text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="mt-2">
                <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className={`h-full transition-all ${strength.color}`} style={{ width: strength.width }} />
                </div>
                <p className="text-xs font-sans text-[var(--text-faint)] mt-1">Strength: {strength.label}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  required
                  className="w-full px-3 pr-10 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="Repeat your new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-sans font-medium rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Resetting...
                </>
              ) : (
                <>
                  <Check size={15} /> Update password
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border)]">
            <Link href="/auth/signin" className="inline-flex items-center gap-2 text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">
              <ArrowLeft size={14} /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
