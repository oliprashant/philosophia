// src/app/not-found.tsx
// Custom 404 page with a philosophical message, search bar, and popular posts.

import Link from 'next/link';
import { Search } from 'lucide-react';
import { prisma } from '@/lib/prisma';

async function getPopularPosts() {
  return prisma.post.findMany({
    where: { published: true },
    take: 4,
    orderBy: { viewCount: 'desc' },
    select: { id: true, title: true, slug: true, category: { select: { name: true, color: true } } },
  });
}

export default async function NotFound() {
  const popular = await getPopularPosts();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        {/* Decorative number */}
        <div
          className="text-[12rem] font-bold leading-none text-[var(--border)] select-none mb-0"
          style={{ fontFamily: 'var(--font-cormorant)' }}
          aria-hidden="true"
        >
          404
        </div>

        <h1 className="text-3xl font-bold -mt-4 mb-4 text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
          The page has wandered off.
        </h1>

        <p className="text-[var(--text-muted)] mb-2 leading-relaxed font-sans text-sm">
          Like a Socratic dialogue that ends mid-thought, this URL leads nowhere.
          Perhaps the idea you were looking for exists elsewhere — or perhaps it
          is waiting to be written.
        </p>

        <blockquote className="my-6 italic text-[var(--text-faint)] text-sm border-l-2 border-[var(--accent)] pl-4 text-left"
          style={{ fontFamily: 'var(--font-cormorant)' }}>
          "Not all those who wander are lost." — J.R.R. Tolkien
        </blockquote>

        {/* Search */}
        <form action="/search" method="GET" className="flex gap-2 mb-8">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              type="search" name="q"
              placeholder="Search for an idea…"
              className="w-full pl-9 pr-4 py-2.5 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <button type="submit"
            className="px-5 py-2.5 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] transition-colors">
            Search
          </button>
        </form>

        {/* Popular posts */}
        {popular.length > 0 && (
          <div className="text-left">
            <p className="text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-3">
              Popular readings
            </p>
            <div className="space-y-2">
              {popular.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  className="flex items-center gap-3 p-3 border border-[var(--border)] hover:border-[var(--accent)] transition-colors group">
                  {post.category && (
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest shrink-0"
                      style={{ color: post.category.color ?? 'var(--accent)' }}>
                      {post.category.name}
                    </span>
                  )}
                  <span className="text-sm font-medium group-hover:text-[var(--accent)] transition-colors line-clamp-1"
                    style={{ fontFamily: 'var(--font-cormorant)' }}>
                    {post.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <Link href="/" className="text-sm font-sans text-[var(--accent)] hover:underline">
            ← Return to Philosophia
          </Link>
        </div>
      </div>
    </div>
  );
}
