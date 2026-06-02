// src/app/blog/page.tsx
// Blog listing page – renders server-side with URL-driven filters.

import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import PostGrid from '@/components/blog/PostGrid';
import CategoryStrip from '@/components/home/CategoryStrip';
import type { PostSummary } from '@/types';
import { getFormBySlug, resolveGenreFilter } from '@/lib/forms';

export const metadata: Metadata = { title: 'All Essays' };

interface PageProps {
  searchParams: { category?: string; form?: string; genre?: string; humour?: string; tag?: string; page?: string };
}

async function getPosts({ searchParams }: PageProps) {
  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: any = { published: true };
  if (searchParams.category) where.category = { slug: searchParams.category };
  const genreFilter = resolveGenreFilter(searchParams.form, searchParams.genre);
  if (genreFilter) where.genre = genreFilter;
  if (searchParams.humour) where.humour = { slug: searchParams.humour };
  if (searchParams.tag) where.tags = { some: { tag: { slug: searchParams.tag } } };

  const [posts, total, categories] = await Promise.all([
    prisma.post.findMany({
      where, skip, take: limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        category: true, humour: true,
        tags: { include: { tag: true } },
        _count: { select: { upvotes: true, comments: true } },
      },
    }),
    prisma.post.count({ where }),
    prisma.category.findMany({ include: { _count: { select: { posts: { where: { published: true } } } } } }),
  ]);

  const normalize = (p: any): PostSummary => ({
    ...p,
    tags: p.tags.map((pt: any) => pt.tag),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  });

  return { posts: posts.map(normalize), total, page, limit, categories };
}

export default async function BlogPage(props: PageProps) {
  const { posts, total, page, limit, categories } = await getPosts(props);
  const { searchParams } = props;

  const activeForm = searchParams.form ? getFormBySlug(searchParams.form) : undefined;
  const activeFilter = searchParams.category || searchParams.form || searchParams.genre || searchParams.humour || searchParams.tag;
  const pageCount = Math.ceil(total / limit);

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
                : activeForm ? activeForm.name + 's'
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
              <a href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                className="px-4 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                ← Previous
              </a>
            )}
            <span className="px-4 py-2 text-sm font-sans text-[var(--text-faint)]">
              Page {page} of {pageCount}
            </span>
            {page < pageCount && (
              <a href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
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
