'use client';
// src/app/auth/register/page.tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Loader2, User, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Auto sign-in after registration
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) { router.push('/auth/signin'); return; }
      toast.success('Welcome to Philosophia!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/"><h1 className="text-4xl font-bold" style={{ fontFamily: 'var(--font-cormorant)' }}>Philosophia</h1></Link>
          <p className="text-sm text-[var(--text-faint)] mt-2 font-sans">Create your account</p>
        </div>

        <div className="border border-[var(--border)] p-8">
          <form onSubmit={submit} className="space-y-4">
            {[
              { label: 'Name', icon: User, value: name, onChange: setName, type: 'text', placeholder: 'Your name' },
              { label: 'Email', icon: Mail, value: email, onChange: setEmail, type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', icon: Lock, value: password, onChange: setPassword, type: 'password', placeholder: 'At least 8 characters' },
            ].map(({ label, icon: Icon, value, onChange, type, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-sans font-medium text-[var(--text-muted)] mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                  <input
                    type={type} value={value} onChange={e => onChange(e.target.value)} required
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={15} className="animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm font-sans text-[var(--text-muted)] mt-6">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-[var(--accent)] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
