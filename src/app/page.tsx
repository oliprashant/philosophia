// src/app/page.tsx
// Homepage: featured posts, categories, hot topics, newsletter CTA

import { prisma } from '@/lib/prisma';
import HeroSection from '@/components/home/HeroSection';
import FeaturedPost from '@/components/home/FeaturedPost';
import PostGrid from '@/components/blog/PostGrid';
import HotTopics from '@/components/blog/HotTopics';
import CategoryStrip from '@/components/home/CategoryStrip';
import HumourSection from '@/components/home/HumourSection';
import NewsletterSection from '@/components/home/NewsletterSection';
import ProtectedAccess from '@/components/home/ProtectedAccess';
import Clock from '@/components/ui/Clock';
import { PostSummary } from '@/types';

// ── Data fetching (Server Component) ─────────────────────────────────────────
async function getHomeData() {
  const [featured, recent, categories, humours, hotTopics] = await Promise.all([
    // Featured post (singular hero)
    prisma.post.findFirst({
      where: { published: true, featured: true },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        category: true,
        humour: true,
        tags: { include: { tag: true } },
        _count: { select: { upvotes: true, comments: true } },
      },
      orderBy: { publishedAt: 'desc' },
    }),

    // Recent published posts
    prisma.post.findMany({
      where: { published: true },
      take: 9,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        category: true,
        humour: true,
        tags: { include: { tag: true } },
        _count: { select: { upvotes: true, comments: true } },
      },
    }),

    // All categories with post counts
    prisma.category.findMany({
      include: { _count: { select: { posts: { where: { published: true } } } } },
    }),

    // All humours
    prisma.humour.findMany({
      include: {
        posts: {
          where: { published: true },
          take: 2,
          orderBy: { publishedAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, image: true, bio: true, role: true } },
            category: true,
            humour: true,
            tags: { include: { tag: true } },
            _count: { select: { upvotes: true, comments: true } },
          },
        },
      },
    }),

    // Hot topics today (most upvotes in last 24h)
    prisma.post.findMany({
      where: {
        published: true,
        upvotes: {
          some: {
            createdAt: { gte: new Date(Date.now() - 86400000) },
          },
        },
      },
      take: 5,
      include: {
        author: { select: { id: true, name: true, image: true, bio: true, role: true } },
        category: true,
        humour: true,
        tags: { include: { tag: true } },
        _count: { select: { upvotes: true, comments: true } },
      },
      orderBy: { upvotes: { _count: 'desc' } },
    }),

  ]);

  return { featured, recent, categories, humours, hotTopics };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const { featured, recent, categories, humours, hotTopics } = await getHomeData();

  // Normalize tags for PostSummary type
  const normalizePosts = (posts: any[]): PostSummary[] =>
    posts.map(p => ({
      ...p,
      tags: p.tags.map((pt: any) => pt.tag),
      publishedAt: p.publishedAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    }));

  const featuredPost = featured
    ? {
        ...featured,
        tags: featured.tags.map((pt: any) => pt.tag),
        publishedAt: featured.publishedAt?.toISOString() ?? null,
        createdAt: featured.createdAt.toISOString(),
      }
    : null;

  return (
    <>
      {/* ── Hero ── */}
      <HeroSection />

      {/* ── Live clock + Date ── */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <Clock />
          <span className="text-xs font-sans text-[var(--text-faint)] tracking-widest uppercase">
            Vol. I · A Journal of Philosophical Inquiry
          </span>
        </div>
      </div>

      {/* ── Category navigation strip ── */}
      <CategoryStrip categories={categories} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* ── Featured post hero ── */}
        {featuredPost && <FeaturedPost post={featuredPost} />}

        {/* ── Hot topics today ── */}
        {hotTopics.length > 0 && (
          <HotTopics posts={normalizePosts(hotTopics)} />
        )}

        <ProtectedAccess />

        {/* ── Recent posts grid ── */}
        <section>
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="section-title">Latest Dispatches</h2>
            <a href="/blog" className="text-sm font-sans text-[var(--accent)] hover:underline">
              View all →
            </a>
          </div>
          <PostGrid posts={normalizePosts(recent)} />
        </section>

        {/* ── Humour taxonomy sections ── */}
        {humours.map(humour => (
          humour.posts.length > 0 && (
            <HumourSection
              key={humour.id}
              humour={humour}
              posts={normalizePosts(humour.posts)}
            />
          )
        ))}

        {/* ── Newsletter ── */}
        <NewsletterSection />
      </div>
    </>
  );
}
