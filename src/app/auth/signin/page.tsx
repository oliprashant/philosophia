'use client';
// src/app/auth/signin/page.tsx
// Custom sign-in page supporting Google, Facebook, and email/password.
// Also links to the registration page for new native accounts.

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

function SignInContent() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const error = params.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('credentials');
    const res = await signIn('credentials', { email, password, redirect: false, callbackUrl });
    setLoading(null);
    if (res?.error) { toast.error('Invalid email or password'); return; }
    router.push(callbackUrl);
  };

  const handleOAuth = async (provider: string) => {
    setLoading(provider);
    await signIn(provider, { callbackUrl });
  };

  const OAUTH_PROVIDERS = [
    { id: 'google',   label: 'Continue with Google',   bg: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50', logo: (
      <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    )},
    { id: 'facebook', label: 'Continue with Facebook', bg: 'bg-[#1877F2] text-white hover:bg-[#166FE5]', logo: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    )},
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Philosophia
            </h1>
          </Link>
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Sign in to join the dialogue</p>
        </div>

        <div className="border border-[var(--border)] p-8 bg-[var(--bg-primary)]">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-600 text-sm font-sans rounded">
              {error === 'OAuthAccountNotLinked'
                ? 'That email is already registered with a different provider.'
                : 'Sign-in failed. Please try again.'}
            </div>
          )}

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            {OAUTH_PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => handleOAuth(p.id)}
                disabled={!!loading}
                className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-sans font-medium border rounded-sm transition-colors disabled:opacity-60 ${p.bg}`}
              >
                {loading === p.id ? <Loader2 size={16} className="animate-spin" /> : p.logo}
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <div className="relative flex justify-center"><span className="px-3 text-xs text-[var(--text-faint)] bg-[var(--bg-primary)] font-sans">or with email</span></div>
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-10 pr-10 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit" disabled={!!loading}
              className="w-full py-2.5 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading === 'credentials' ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm font-sans text-[var(--text-muted)] mt-6">
            No account?{' '}
            <Link href="/auth/register" className="text-[var(--accent)] hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading sign-in...</div>}>
      <SignInContent />
    </Suspense>
  );
}