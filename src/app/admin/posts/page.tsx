'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckSquare, Copy, Eye, Loader2, PenLine, RefreshCw, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

type AdminPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  published: boolean;
  featured: boolean;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type FilterStatus = 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export default function AdminPostsPage() {
  const [items, setItems] = useState<AdminPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
  const [busyId, setBusyId] = useState('');

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        if (search.trim()) params.set('q', search.trim());
        if (status !== 'all') params.set('status', status);

        const response = await fetch(`/api/admin/posts?${params.toString()}`, { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not load posts');
        }

        if (!cancelled) {
          setItems(data.items || []);
          setTotal(data.total || 0);
        }
      } catch (error: any) {
        if (!cancelled) {
          toast.error(error.message || 'Could not load posts');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, limit, search, status]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const refresh = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set('q', search.trim());
      if (status !== 'all') params.set('status', status);
      const response = await fetch(`/api/admin/posts?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not load posts');
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (error: any) {
      toast.error(error.message || 'Could not load posts');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const archivePost = async (id: string) => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not archive post');
      toast.success('Post archived');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Could not archive post');
    } finally {
      setBusyId('');
    }
  };

  const duplicatePost = async (id: string) => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/posts/${id}/duplicate`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not duplicate post');
      toast.success('Draft duplicated');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Could not duplicate post');
    } finally {
      setBusyId('');
    }
  };

  const restorePost = async (id: string) => {
    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not restore post');
      toast.success('Post restored to draft');
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Could not restore post');
    } finally {
      setBusyId('');
    }
  };

  const applyBulk = async () => {
    if (!selectedIds.length) {
      toast.error('Select at least one post');
      return;
    }

    try {
      const response = await fetch('/api/admin/posts/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update posts');
      toast.success(`Updated ${data.count} post(s)`);
      setSelectedIds([]);
      await refresh();
    } catch (error: any) {
      toast.error(error.message || 'Could not update posts');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-faint)]">Admin</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Posts
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/admin/editor/new" className="inline-flex items-center gap-2 bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]">
            <PenLine size={15} /> New Post
          </Link>
          <button type="button" onClick={refresh} className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', 'PUBLISHED', 'DRAFT', 'ARCHIVED'] as FilterStatus[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatus(tab)}
              className={`rounded-sm px-3 py-2 text-xs font-medium uppercase tracking-widest transition-colors ${status === tab ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]' : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title..."
              className="w-72 max-w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')} className="rounded border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]">
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <button type="button" onClick={applyBulk} className="inline-flex items-center gap-2 rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]">
              <CheckSquare size={15} /> Apply to selected
            </button>
          </div>
        </div>
      </div>

      <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-3 px-6 py-12 text-[var(--text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading posts...
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[var(--text-muted)]">No posts found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)] text-left text-sm">
              <thead className="bg-[var(--bg-primary)] text-xs uppercase tracking-widest text-[var(--text-faint)]">
                <tr>
                  <th className="px-4 py-3"><input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === items.length} onChange={() => setSelectedIds(selectedIds.length === items.length ? [] : items.map(item => item.id))} /></th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {items.map(post => (
                  <tr key={post.id} className="align-top">
                    <td className="px-4 py-4"><input type="checkbox" checked={selectedIds.includes(post.id)} onChange={() => toggleSelected(post.id)} /></td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-[var(--text-primary)]">{post.title}</div>
                      <div className="mt-1 text-xs text-[var(--text-faint)]">/{post.slug}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs uppercase tracking-widest text-[var(--text-muted)]">{post.status}</span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--text-muted)]">
                      <div>Updated {format(new Date(post.updatedAt), 'MMM d, yyyy')}</div>
                      {post.publishedAt ? <div>Published {format(new Date(post.publishedAt), 'MMM d, yyyy')}</div> : null}
                    </td>
                    <td className="px-4 py-4 text-xs text-[var(--text-muted)]">{post.featured ? 'Featured' : '—'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/editor?id=${post.id}`} className="inline-flex items-center gap-1 rounded-sm border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">
                          <PenLine size={12} /> Edit
                        </Link>
                        {post.status === 'ARCHIVED' ? (
                          <button type="button" onClick={() => restorePost(post.id)} disabled={busyId === post.id} className="inline-flex items-center gap-1 rounded-sm border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:opacity-60">
                            Restore
                          </button>
                        ) : (
                          <button type="button" onClick={() => archivePost(post.id)} disabled={busyId === post.id} className="inline-flex items-center gap-1 rounded-sm border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:opacity-60">
                            <Trash2 size={12} /> Archive
                          </button>
                        )}
                        <button type="button" onClick={() => duplicatePost(post.id)} disabled={busyId === post.id} className="inline-flex items-center gap-1 rounded-sm border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:opacity-60">
                          <Copy size={12} /> Duplicate
                        </button>
                        {post.status === 'PUBLISHED' ? (
                          <Link href={`/blog/${post.slug}`} target="_blank" className="inline-flex items-center gap-1 rounded-sm border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">
                            <Eye size={12} /> View
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <span>
          Page {page} of {totalPages} · {total} posts
        </span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage(prev => Math.max(1, prev - 1))} className="rounded-sm border border-[var(--border)] px-3 py-2 transition-colors hover:border-[var(--accent)] disabled:opacity-50">
            Previous
          </button>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage(prev => prev + 1)} className="rounded-sm border border-[var(--border)] px-3 py-2 transition-colors hover:border-[var(--accent)] disabled:opacity-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
