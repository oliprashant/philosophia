'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

type FormItem = { id: string; name: string; slug: string };

interface FormsDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FormsMobileLinks({ onNavigate }: { onNavigate?: () => void }) {
  const searchParams = useSearchParams();
  const activeForm = searchParams.get('form');
  const { forms } = useFormsList();

  return (
    <>
      {forms.map(form => (
        <Link
          key={form.slug}
          href={`/blog?form=${form.slug}`}
          className={`block px-2 py-2 text-sm font-sans transition-colors ${
            activeForm === form.slug
              ? 'text-[var(--accent)] font-medium'
              : 'text-[var(--text-secondary)] hover:text-[var(--accent)]'
          }`}
          onClick={onNavigate}
        >
          {form.name}
        </Link>
      ))}
    </>
  );
}

function useFormsList() {
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/forms');
        if (!res.ok) throw new Error('Failed to load forms');
        const data = await res.json();
        if (!cancelled) setForms(data.forms ?? []);
      } catch {
        if (!cancelled) setForms([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { forms, loading };
}

export default function FormsDropdown({ open, onOpenChange }: FormsDropdownProps) {
  const searchParams = useSearchParams();
  const activeForm = searchParams.get('form');
  const { forms } = useFormsList();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="flex items-center gap-1 text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        aria-expanded={open}
      >
        Forms <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-card py-1 animate-slide-down">
          {forms.map(form => (
            <Link
              key={form.slug}
              href={`/blog?form=${form.slug}`}
              className={`block px-4 py-2 text-sm font-sans transition-colors ${
                activeForm === form.slug
                  ? 'bg-[var(--bg-secondary)] text-[var(--accent)] font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]'
              }`}
              onClick={() => onOpenChange(false)}
            >
              {form.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
