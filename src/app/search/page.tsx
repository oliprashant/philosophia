'use client';
// src/app/search/page.tsx

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import PostCard from '@/components/blog/PostCard';
import type { PostSummary, Paginated } from '@/types';

export const dynamic = 'force-dynamic'; // 👈 prevents static prerender crash

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest first' },
  { value: 'oldest',   label: 'Oldest first' },
  { value: 'upvotes',  label: 'Most upvoted' },
  { value: 'comments', label: 'Most discussed' },
  { value: 'views',    label: 'Most viewed' },
];

const GENRE_OPTIONS = ['ESSAY','DIALOGUE','POEM','APHORISM','LETTER','REVIEW','INTERVIEW'];
const CATEGORY_OPTIONS = ['ethics','metaphysics','existentialism','epistemology','aesthetics'];

// 👇 Inner component — the only thing that changed structurally
function SearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ]               = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [genre, setGenre]       = useState(searchParams.get('genre') || '');
  const [sort, setSort]         = useState(searchParams.get('sort') || 'newest');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo]     = useState(searchParams.get('dateTo') || '');
  const [showFilters, setShowFilters] = useState(false);

  const [results, setResults] = useState<PostSummary[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const buildQuery = useCallback((p = 1) => {
    const params = new URLSearchParams();
    if (q)        params.set('q', q);
    if (category) params.set('category', category);
    if (genre)    params.set('genre', genre);
    if (sort)     params.set('sort', sort);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo)   params.set('dateTo', dateTo);
    params.set('page', String(p));
    params.set('limit', '12');
    return params.toString();
  }, [q, category, genre, sort, dateFrom, dateTo]);

  const fetchResults = useCallback(async (p = 1, append = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?${buildQuery(p)}`);
      const data: Paginated<PostSummary> = await res.json();
      setResults(prev => append ? [...prev, ...data.items] : data.items);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchResults(1); }, q ? 350 : 0);
    return () => clearTimeout(timer);
  }, [q, category, genre, sort, dateFrom, dateTo]);

  const clearFilters = () => {
    setCategory(''); setGenre(''); setDateFrom(''); setDateTo(''); setSort('newest');
  };
  const hasActiveFilters = category || genre || dateFrom || dateTo || sort !== 'newest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title mb-6">Search</h1>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search essays, ideas, philosophers…"
              className="w-full pl-12 pr-4 py-3 font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-sans border transition-colors ${showFilters ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]'}`}
          >
            <SlidersHorizontal size={15} />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 p-5 border border-[var(--border)] bg-[var(--bg-secondary)] animate-slide-down">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-sans font-medium text-[var(--text-faint)] uppercase tracking-wider mb-2">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]">
                  <option value="">All</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-[var(--text-faint)] uppercase tracking-wider mb-2">Form</label>
                <select value={genre} onChange={e => setGenre(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]">
                  <option value="">All</option>
                  {GENRE_OPTIONS.map(g => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-[var(--text-faint)] uppercase tracking-wider mb-2">Sort by</label>
                <select value={sort} onChange={e => setSort(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-sans font-medium text-[var(--text-faint)] uppercase tracking-wider mb-2">Date range</label>
                <div className="flex gap-1.5">
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-2 text-xs font-sans bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]" />
                  <span className="text-[var(--text-faint)] self-center text-xs">–</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="flex-1 min-w-0 px-2 py-2 text-xs font-sans bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-4 flex items-center gap-1.5 text-xs font-sans text-[var(--accent)] hover:underline">
                <X size={12} /> Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {loading && results.length === 0 ? (
        <div className="flex items-center justify-center gap-3 py-24 text-[var(--text-faint)]">
          <Loader2 size={20} className="animate-spin" />
          <span className="font-sans text-sm">Searching…</span>
        </div>
      ) : (
        <>
          {q && (
            <p className="text-sm font-sans text-[var(--text-faint)] mb-6">
              {total === 0 ? 'No results' : `${total} result${total !== 1 ? 's' : ''}`}
              {q && <> for <span className="text-[var(--text-primary)] font-medium">"{q}"</span></>}
            </p>
          )}
          {results.length === 0 && !loading ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4" style={{ fontFamily: 'var(--font-cormorant)' }}>∅</p>
              <p className="text-[var(--text-muted)] font-sans">No essays found. Try different search terms or clear filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {results.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
            </div>
          )}
          {hasMore && (
            <div className="flex justify-center mt-12">
              <button
                onClick={() => fetchResults(page + 1, true)}
                disabled={loading}
                className="px-8 py-3 text-sm font-sans border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <><Loader2 size={14} className="animate-spin" /> Loading…</> : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 👇 Default export wraps inner component in Suspense
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center gap-3 py-24 text-[var(--text-faint)]">
        <Loader2 size={20} className="animate-spin" />
        <span className="font-sans text-sm">Loading…</span>
      </div>
    }>
      <SearchInner />
    </Suspense>
  );
}