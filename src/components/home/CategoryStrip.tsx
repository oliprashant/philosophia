// src/components/home/CategoryStrip.tsx
'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Category { id: string; name: string; slug: string; color: string | null; _count: { posts: number } }

export default function CategoryStrip({ categories }: { categories: Category[] }) {
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg-secondary)] overflow-x-auto" aria-label="Categories">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-0 min-w-max">
          <Link
            href="/blog"
            className="px-5 py-3 text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] border-b-2 border-transparent hover:border-[var(--accent)] transition-all whitespace-nowrap"
          >
            All
          </Link>
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/blog?category=${cat.slug}`}
              className="px-5 py-3 text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)] border-b-2 border-transparent hover:border-[var(--accent)] transition-all whitespace-nowrap flex items-center gap-1.5"
              style={{ ['--hover-color' as string]: cat.color ?? undefined }}
            >
              {cat.name}
              <span className="text-[10px] text-[var(--text-faint)]">({cat._count.posts})</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
