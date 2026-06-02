// src/app/blog/[slug]/page.tsx
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
import SaveButton from '@/components/blog/SaveButton';
import AISummaryButton from '@/components/ai/AISummaryButton';
import SuggestionModal from '@/components/blog/SuggestionModal';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { auth } from '@/lib/auth';
import { ReadingModeProvider } from '@/hooks/useReadingMode';

export const dynamicParams = true;
export const revalidate = 60; // ISR: Revalidate every 60 seconds

export async function generateStaticParams() {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      select: { slug: true },
    });
    return posts.map(p => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

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
  prisma.post.update({ where: { id: post.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});
  return post;
}

async function getRelatedPosts(postId: string, categoryId: string | null, tagIds: string[]) {
  // Prioritize category matches first, then tag matches if needed
  let relatedPosts = [];
  
  if (categoryId) {
    relatedPosts = await prisma.post.findMany({
      where: {
        published: true,
        id: { not: postId },
        categoryId,
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

  // If not enough category matches, add tag-based matches
  if (relatedPosts.length < 3 && tagIds.length > 0) {
    const additionalPosts = await prisma.post.findMany({
      where: {
        published: true,
        id: { not: postId, notIn: relatedPosts.map(p => p.id) },
        tags: { some: { tagId: { in: tagIds } } },
      },
      take: 3 - relatedPosts.length,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        category: true,
        humour: true,
        tags: { include: { tag: true } },
        _count: { select: { upvotes: true, comments: true } },
      },
    });
    relatedPosts = relatedPosts.concat(additionalPosts);
  }

  return relatedPosts;
}

async function getInitialComments(postId: string) {
  try {
    // Reduced from 30 to 10 to improve load time
    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null, deleted: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        _count: { select: { upvotes: true, replies: true } },
        replies: undefined, // Don't fetch replies on initial load
      },
    });

    return comments.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      replies: [],
      _count: { ...c._count, upvotes: c._count.upvotes },
    }));
  } catch {
    return [];
  }
}

async function getHighlights(userId: string, postId: string) {
  try {
    return await prisma.highlight.findMany({
      where: { userId, postId },
      orderBy: { createdAt: 'asc' },
    });
  } catch {
    return [];
  }
}

async function checkUpvoted(userId: string, postId: string) {
  try {
    const upvote = await prisma.upvote.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!upvote;
  } catch {
    return false;
  }
}

async function checkSaved(userId: string, postId: string) {
  try {
    const saved = await prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return !!saved;
  } catch {
    return false;
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const [post, session] = await Promise.all([
    getPost(params.slug),
    auth(),
  ]);

  if (!post) notFound();

  const tagIds = post.tags.map((pt: any) => pt.tagId);
  const userId = (session?.user as any)?.id ?? null;

  // Parallelize these queries for better performance
  const [relatedRaw, hasUpvoted, hasSaved, highlights, initialComments] = await Promise.all([
    getRelatedPosts(post.id, post.categoryId, tagIds),
    userId ? checkUpvoted(userId, post.id) : Promise.resolve(false),
    userId ? checkSaved(userId, post.id) : Promise.resolve(false),
    userId ? getHighlights(userId, post.id) : Promise.resolve([]),
    getInitialComments(post.id),
  ]);

  const normalizePost = (p: any) => ({
    ...p,
    tags: p.tags.map((pt: any) => pt.tag),
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  });

  const fullPost = normalizePost(post);
  const related = relatedRaw.map(normalizePost);
  const siteUrl = process.env.NEXTAUTH_URL || 'https://philosophia.blog';
  const postUrl = `${siteUrl}/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: post.category?.name ?? 'Blog', href: post.category ? `/blog?category=${post.category.slug}` : '/blog' },
            { label: post.title, href: '' },
          ]}
        />
      </div>

      <ReadingModeProvider postId={post.id} userId={userId} initialHighlights={highlights}>
        <ReadingToolbar postId={post.id} userId={userId} initialHighlights={highlights} />

        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12" id="article-content">
          <ArticleHeader post={fullPost} />

          <div className="flex flex-wrap items-center gap-3 mb-10 py-4 border-y border-[var(--border)]">
            <UpvoteButton postId={post.id} initialCount={post._count.upvotes} initialState={hasUpvoted} />
            <AISummaryButton postId={post.id} cachedSummary={post.aiSummary} title={post.title} />
            <SuggestionModal postId={post.id} userId={userId} />
            <SaveButton postId={post.id} initialState={hasSaved} />
            <div className="ml-auto">
              <ShareButtons url={postUrl} title={post.title} />
            </div>
          </div>

          <ArticleContent content={post.content} />

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
      </ReadingModeProvider>

      {related.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-[var(--border)]">
          <RelatedPosts posts={related} />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <CommentSection 
          postId={post.id} 
          userId={userId} 
          userName={session?.user?.name ?? null}
          initialComments={initialComments}
        />
      </div>
    </div>
  );
}