'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<'google' | 'credentials' | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading('credentials');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not sign in');
      }

      toast.success('Signed in successfully');
      router.push('/profile');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Could not sign in');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-16 text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Philosophia
            </h1>
          </Link>
          <p className="mt-2 text-sm text-[var(--text-faint)]">Sign in with email/password or Google</p>
          {searchParams.get('reset') === 'true' ? (
            <p className="mt-3 rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-xs text-[var(--text-muted)]">
              Your password was reset. Sign in with your new credentials.
            </p>
          ) : null}
        </div>

        <div className="border border-[var(--border)] bg-[var(--bg-secondary)] p-8 shadow-sm">
          <button
            type="button"
            onClick={async () => {
              setLoading('google');
              try {
                const result = await signInWithGoogle();
                if (result === null) {
                  toast('Google sign-in cancelled', { icon: '⚪' });
                  return;
                }
                router.push('/profile');
                router.refresh();
              } catch (error) {
                console.error('Google sign-in failed:', error);
                toast.error('Google sign-in failed. Please try again.');
              } finally {
                setLoading(null);
              }
            }}
            disabled={!!loading}
            className="mb-6 flex w-full items-center justify-center gap-3 rounded-sm border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            {loading === 'google' ? <Loader2 size={16} className="animate-spin" /> : <span className="text-lg font-bold text-[#4285F4]">G</span>}
            Sign in with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[var(--bg-secondary)] px-3 text-xs text-[var(--text-faint)]">or with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
                  className="w-full border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[var(--text-muted)]">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                  className="w-full border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-10 pr-10 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 bg-[var(--text-primary)] py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)] disabled:opacity-60"
            >
              {loading === 'credentials' ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
              Sign In
            </button>

            <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
              <Link href="/auth/register" className="text-[var(--accent)] hover:underline">
                Create account
              </Link>
              <Link href="/auth/forgot-password" className="text-[var(--accent)] hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
