// src/app/blog/[slug]/page.tsx
// Full article page with:
// - Reading mode toggle
// - Highlighting
// - AI summary
// - Comments
// - Related posts
// - Share buttons
// - Upvote
// - Suggestions

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ArticleContent from '@/components/blog/ArticleContent';
import ArticleHeader from '@/components/blog/ArticleHeader';
import ReadingToolbar from '@/components/reading/ReadingToolbar';
import CommentSection from '@/components/comments/CommentSection';
import RelatedPosts from '@/components/blog/RelatedPosts';
import ShareButtons from '@/components/blog/ShareButtons';
import UpvoteButton from '@/components/blog/UpvoteButton';
import AISummaryButton from '@/components/ai/AISummaryButton';
import SuggestionModal from '@/components/blog/SuggestionModal';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { auth } from '@/lib/auth';

// ── Generate static params for ISR ───────────────────────────────────────────
export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return posts.map(p => ({ slug: p.slug }));
}

// ── Dynamic metadata ───────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await prisma.post.findUnique({
    where: { slug: params.slug, published: true },
    include: { author: true, category: true },
  });

  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    authors: [{ name: post.author.name ?? undefined }],
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [{ url: post.coverImage, alt: post.coverAlt ?? post.title }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
    },
  };
}

// ── Data fetching ──────────────────────────────────────────────────────────────
async function getPost(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug, published: true },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true, role: true } },
      category: true,
      humour: true,
      tags: { include: { tag: true } },
      _count: { select: { upvotes: true, comments: true } },
    },
  });

  if (!post) return null;

  // Increment view count (fire-and-forget)
  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return post;
}

async function getRelatedPosts(postId: string, categoryId: string | null, tagIds: string[]) {
  return prisma.post.findMany({
    where: {
      published: true,
      id: { not: postId },
      OR: [
        categoryId ? { categoryId } : {},
        tagIds.length ? { tags: { some: { tagId: { in: tagIds } } } } : {},
      ],
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    include: {
      author: { select: { id: true, name: true, image: true, bio: true, role: true } },
      category: true,
      humour: true,
      tags: { include: { tag: true } },
      _count: { select: { upvotes: true, comments: true } },
    },
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const [post, session] = await Promise.all([
    getPost(params.slug),
    auth(),
  ]);

  if (!post) notFound();

  const tagIds = post.tags.map((pt: any) => pt.tagId);
  const relatedRaw = await getRelatedPosts(post.id, post.categoryId, tagIds);

  const normalizePost = (p: any) => ({
    ...p,
    tags: p.tags.map((pt: any) => pt.tag),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  });

  const fullPost = normalizePost(post);
  const related = relatedRaw.map(normalizePost);

  const userId = (session?.user as any)?.id ?? null;
  const siteUrl = process.env.NEXTAUTH_URL || 'https://philosophia.blog';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  // Check if current user has upvoted
  let hasUpvoted = false;
  if (userId) {
    const upvote = await prisma.upvote.findUnique({ where: { userId_postId: { userId, postId: post.id } } });
    hasUpvoted = !!upvote;
  }

  // Get user's saved highlights for this post
  let highlights: any[] = [];
  if (userId) {
    highlights = await prisma.highlight.findMany({
      where: { userId, postId: post.id },
      orderBy: { createdAt: 'asc' },
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: post.category?.name ?? 'Blog', href: post.category ? `/blog?category=${post.category.slug}` : '/blog' },
            { label: post.title, href: '' },
          ]}
        />
      </div>

      {/* Reading mode toolbar (client component) */}
      <ReadingToolbar postId={post.id} userId={userId} initialHighlights={highlights} />

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12" id="article-content">
        <ArticleHeader post={fullPost} />

        {/* AI + Actions row */}
        <div className="flex flex-wrap items-center gap-3 mb-10 py-4 border-y border-[var(--border)]">
          <UpvoteButton postId={post.id} initialCount={post._count.upvotes} initialState={hasUpvoted} />
          <AISummaryButton postId={post.id} cachedSummary={post.aiSummary} title={post.title} />
          <SuggestionModal postId={post.id} userId={userId} />
          <div className="ml-auto">
            <ShareButtons url={postUrl} title={post.title} />
          </div>
        </div>

        {/* Main content */}
        <ArticleContent content={post.content} />

        {/* Tags */}
        {fullPost.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-[var(--border)]">
            {fullPost.tags.map((tag: any) => (
              <a
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className="px-3 py-1 text-xs font-sans border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                #{tag.name}
              </a>
            ))}
          </div>
        )}
      </article>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[var(--border)]">
          <RelatedPosts posts={related} />
        </div>
      )}

      {/* Comments */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <CommentSection postId={post.id} userId={userId} userName={session?.user?.name ?? null} />
      </div>
    </div>
  );
}
