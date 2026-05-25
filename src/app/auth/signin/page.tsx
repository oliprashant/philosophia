'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

export default function SignInPage() {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Sign in to join the dialogue</p>
        </div>

        <div className="border border-[var(--border)] p-8 bg-[var(--bg-primary)]">
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={async () => {
                setLoading('google');
                try {
                  const result = await signInWithGoogle();
                  if (result === null) {
                    // User closed the popup or cancelled — show subtle toast
                    toast('Google sign-in cancelled', { icon: '⚪' });
                    return;
                  }
                } catch (err) {
                  console.error('Google sign-in failed:', err);
                  toast.error('Google sign-in failed. Please try again.');
                } finally {
                  setLoading(null);
                }
              }}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-sans font-medium border rounded-sm transition-colors disabled:opacity-60 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              {loading === 'google' ? <Loader2 size={16} className="animate-spin" /> : <span className="text-[#4285F4] text-lg font-bold">G</span>}
              Continue with Google
            </button>

            <button
              type="button"
              disabled
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 text-sm font-sans font-medium border rounded-sm transition-colors disabled:opacity-60 bg-[#1877F2] text-white hover:bg-[#166FE5]"
            >
              <span className="text-lg font-bold">f</span>
              Continue with Facebook
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]" /></div>
            <div className="relative flex justify-center"><span className="px-3 text-xs text-[var(--text-faint)] bg-[var(--bg-primary)] font-sans">or with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  required
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
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!!loading}
              className="w-full py-2.5 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading === 'credentials' ? <><Loader2 size={15} className="animate-spin" /> Signing in…</> : 'Sign In'}
            </button>

            <p className="text-center text-sm font-sans text-[var(--text-muted)] mt-6">
              No account?{' '}
              <Link href="/auth/register" className="text-[var(--accent)] hover:underline">Create one</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}