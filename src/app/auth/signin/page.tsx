'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Chrome, Facebook, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function SignInPage() {
  const { signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-[#faf3e8] px-4 py-10 text-[#2f2213]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[420px] flex-col items-center justify-start pt-2">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-[46px] leading-none font-semibold tracking-tight text-[#1f140b]" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Philosophia
            </h1>
          </Link>
          <p className="mt-2 text-[15px] text-[#7f5f44]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Sign in to join the dialogue
          </p>
        </div>

        <div className="w-full border border-[#e0c7a0] bg-[#fbf6ee] px-5 py-6 shadow-[0_0_0_1px_rgba(255,255,255,0.45)_inset]">
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="flex w-full items-center justify-center gap-3 border border-[#cfcbd6] bg-white px-4 py-2.5 text-[15px] font-medium text-[#2d3550] transition-colors hover:bg-[#f7f8fb]"
            >
              <Chrome className="h-5 w-5 text-[#4285F4]" />
              Continue with Google
            </button>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-3 bg-[#1877f2] px-4 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-[#1569d6]"
            >
              <Facebook className="h-5 w-5" />
              Continue with Facebook
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-center text-[13px] text-[#8d6c4d]">
            <span className="h-px flex-1 bg-[#e0c7a0]" />
            <span>or with email</span>
            <span className="h-px flex-1 bg-[#e0c7a0]" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block text-[13px] font-medium text-[#3c2d1f]">
              Email
              <div className="mt-2 flex items-center border border-[#e0c7a0] bg-[#fbf6ee] px-3 py-2.5 focus-within:border-[#b88952]">
                <Mail className="h-4 w-4 shrink-0 text-[#ad8a62]" />
                <input
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="ml-3 w-full bg-transparent text-[15px] text-[#2f2213] placeholder:text-[#bca68a] outline-none"
                />
                <span className="ml-3 inline-flex h-5 w-5 items-center justify-center rounded-sm bg-[#1abc9c] text-white">
                  <Mail className="h-3.5 w-3.5" />
                </span>
              </div>
            </label>

            <label className="block text-[13px] font-medium text-[#3c2d1f]">
              Password
              <div className="mt-2 flex items-center border border-[#e0c7a0] bg-[#fbf6ee] px-3 py-2.5 focus-within:border-[#b88952]">
                <Lock className="h-4 w-4 shrink-0 text-[#ad8a62]" />
                <input
                  type="password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="ml-3 w-full bg-transparent text-[15px] text-[#2f2213] placeholder:text-[#bca68a] outline-none"
                />
                <span className="ml-3 text-[#ad8a62]">◔</span>
              </div>
            </label>

            <button
              type="submit"
              className="w-full bg-[#1f140b] px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#2b1c10]"
            >
              Sign In
            </button>

            <p className="pt-1 text-center text-[14px] text-[#6c5140]">
              No account?{' '}
              <Link href="/auth/register" className="text-[#c14d61] hover:underline">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}