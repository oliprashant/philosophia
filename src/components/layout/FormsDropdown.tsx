'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { FORMS, type FormItem } from '@/lib/forms';

export default function FormsDropdown() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeForm, setActiveForm] = useState('');
  const [items, setItems] = useState<FormItem[]>([...FORMS]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const syncActiveForm = () => {
      const form = new URLSearchParams(window.location.search).get('form') || '';
      if (!cancelled) {
        setActiveForm(form);
      }
    };

    syncActiveForm();

    const loadForms = async () => {
      try {
        const response = await fetch('/api/forms', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as FormItem[];
        if (!cancelled && Array.isArray(data) && data.length > 0) {
          setItems(data);
        }
      } catch {
        // Keep the fallback list when the endpoint is unavailable.
      }
    };

    loadForms();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const label = activeForm
    ? items.find(item => item.slug === activeForm)?.name || activeForm
    : 'Forms';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(value => !value)}
        className="flex items-center gap-1 text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        aria-expanded={open}
        aria-label="Forms navigation"
      >
        {label} <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-44 bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-card py-1 animate-slide-down z-50">
          <Link
            href="/blog"
            className={`block px-4 py-2 text-sm font-sans transition-colors ${!activeForm ? 'bg-[var(--bg-secondary)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]'}`}
            onClick={() => setOpen(false)}
          >
            All Forms
          </Link>
          {items.map(item => {
            const isActive = item.slug === activeForm;
            return (
              <Link
                key={item.id}
                href={`/blog?form=${item.slug}`}
                className={`block px-4 py-2 text-sm font-sans transition-colors ${isActive ? 'bg-[var(--bg-secondary)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]'}`}
                onClick={() => setOpen(false)}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
