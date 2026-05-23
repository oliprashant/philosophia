'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OTP_LENGTH = 8;
const RESEND_SECONDS = 60;

function VerifyOtpContent() {
  const router = useRouter();
  const params = useSearchParams();
  const email = useMemo(() => params.get('email')?.toLowerCase().trim() ?? '', [params]);

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [shake, setShake] = useState(false);
  const [pulseSuccess, setPulseSuccess] = useState(false);

  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) {
      router.replace('/auth/forgot-password');
      return;
    }

    refs.current[0]?.focus();
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((char, idx) => {
      next[idx] = char;
    });

    setOtp(next);
    refs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
  };

  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error(`Please enter the full ${OTP_LENGTH}-digit code`);
      return;
    }

    setLoading(true);
    setShake(false);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setPulseSuccess(true);
      sessionStorage.setItem('reset_refresh_token', data.refreshToken || '');
      toast.success('OTP verified successfully');
      router.push(`/auth/reset-password?token=${encodeURIComponent(data.accessToken)}`);
    } catch (error: any) {
      setShake(true);
      setTimeout(() => setShake(false), 450);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not resend OTP');
      }

      setCountdown(RESEND_SECONDS);
      toast.success('A new verification code has been sent');
    } catch (error: any) {
      toast.error(error.message || 'Could not resend OTP');
    } finally {
      setResendLoading(false);
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
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Verify your email</p>
        </div>

        <div className={`border border-[var(--border)] rounded-xl p-8 bg-[var(--bg-primary)] shadow-sm transition-all ${shake ? 'animate-[shake_0.45s_ease]' : ''} ${pulseSuccess ? 'animate-pulse' : ''}`}>
          <p className="text-sm font-sans text-[var(--text-muted)] mb-5 text-center">
            Enter the verification code sent to
            <br />
            <span className="text-[var(--text-primary)] font-medium">{email}</span>
          </p>

          <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: `repeat(${OTP_LENGTH}, minmax(0, 1fr))` }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={el => {
                  refs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-12 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-center text-lg font-semibold text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)]"
              />
            ))}
          </div>

          <button
            type="button"
            onClick={verifyOtp}
            disabled={loading}
            className="w-full py-2.5 text-sm font-sans font-medium rounded-lg bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 size={15} className="animate-spin" /> Verifying…</> : <><Check size={15} /> Verify OTP</>}
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={resendLoading || countdown > 0}
            className="w-full mt-3 py-2.5 text-sm font-sans font-medium rounded-lg border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-60 transition-colors"
          >
            {resendLoading
              ? 'Sending…'
              : countdown > 0
                ? `Resend code in ${countdown}s`
                : 'Resend code'}
          </button>

          <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-sans">
            <Link href="/auth/forgot-password" className="inline-flex items-center gap-2 text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">
              <ArrowLeft size={14} /> Change email
            </Link>
            <Link href="/auth/signin" className="text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-6px);
          }
          40% {
            transform: translateX(6px);
          }
          60% {
            transform: translateX(-4px);
          }
          80% {
            transform: translateX(4px);
          }
        }
      `}</style>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--text-primary)]">
          Loading...
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
