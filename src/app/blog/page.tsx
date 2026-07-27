// src/app/blog/page.tsx
// Blog listing page – renders server-side with URL-driven filters.

import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import PostGrid from '@/components/blog/PostGrid';
import CategoryStrip from '@/components/home/CategoryStrip';
import type { PostSummary } from '@/types';
import { FORMS } from '@/lib/forms';

export const metadata: Metadata = { title: 'All Essays' };

interface PageProps {
  searchParams: { category?: string; genre?: string; humour?: string; tag?: string; form?: string; page?: string };
}

async function getPosts({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const limit = 12;
  const headersList = headers();
  const host = headersList.get('x-forwarded-host') || headersList.get('host');
  const proto = headersList.get('x-forwarded-proto') || 'http';
  const baseUrl = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.genre) params.set('genre', searchParams.genre);
  if (searchParams.humour) params.set('humour', searchParams.humour);
  if (searchParams.tag) params.set('tag', searchParams.tag);
  if (searchParams.form) params.set('formSlug', searchParams.form);

  const [postsResponse, categories] = await Promise.all([
    fetch(`${baseUrl}/api/posts?${params.toString()}`, { cache: 'no-store' }),
    prisma.category.findMany({ include: { _count: { select: { posts: { where: { published: true } } } } } }),
  ]);

  const data = await postsResponse.json();
  const posts = Array.isArray(data.items) ? (data.items as PostSummary[]) : [];
  const total = typeof data.total === 'number' ? data.total : posts.length;

  return { posts, total, page, limit, categories };
}

export default async function BlogPage(props: PageProps) {
  const { posts, total, page, limit, categories } = await getPosts(props);
  const { searchParams } = props;

  const activeFilter = searchParams.category || searchParams.genre || searchParams.humour || searchParams.tag || searchParams.form;
  const pageCount = Math.ceil(total / limit);
  const activeForm = searchParams.form ? FORMS.find(form => form.slug === searchParams.form)?.name ?? searchParams.form : '';

  const withPage = (nextPage: number) => {
    const params = new URLSearchParams();
    if (searchParams.category) params.set('category', searchParams.category);
    if (searchParams.genre) params.set('genre', searchParams.genre);
    if (searchParams.humour) params.set('humour', searchParams.humour);
    if (searchParams.tag) params.set('tag', searchParams.tag);
    if (searchParams.form) params.set('form', searchParams.form);
    params.set('page', String(nextPage));
    return `?${params.toString()}`;
  };

  return (
    <div className="min-h-screen">
      <CategoryStrip categories={categories} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10 flex items-baseline justify-between">
          <div>
            <h1 className="section-title">
              {searchParams.category
                ? categories.find(c => c.slug === searchParams.category)?.name ?? 'Category'
                : searchParams.form
                  ? activeForm
                : searchParams.genre ? searchParams.genre.charAt(0) + searchParams.genre.slice(1).toLowerCase() + 's'
                : searchParams.tag ? `#${searchParams.tag}`
                : 'All Essays'}
            </h1>
            <p className="text-sm text-[var(--text-faint)] font-sans mt-1">{total} post{total !== 1 ? 's' : ''}</p>
          </div>
          {activeFilter && (
            <a href="/blog" className="text-xs font-sans text-[var(--accent)] hover:underline">Clear filter ×</a>
          )}
        </div>

        <PostGrid posts={posts} />

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {page > 1 && (
              <a href={withPage(page - 1)}
                className="px-4 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                ← Previous
              </a>
            )}
            <span className="px-4 py-2 text-sm font-sans text-[var(--text-faint)]">
              Page {page} of {pageCount}
            </span>
            {page < pageCount && (
              <a href={withPage(page + 1)}
                className="px-4 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                Next →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
