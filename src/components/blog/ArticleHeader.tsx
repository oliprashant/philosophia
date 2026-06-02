// src/components/blog/ArticleHeader.tsx
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { Clock, Eye, BookOpen } from 'lucide-react';
import type { PostFull } from '@/types';
import { FORMS } from '@/lib/forms';

const GENRE_LABELS: Record<string, string> = {
  ESSAY: 'Essay', DIALOGUE: 'Dialogue', POEM: 'Poem',
  APHORISM: 'Aphorism', LETTER: 'Letter', REVIEW: 'Review', INTERVIEW: 'Interview',
};

export default function ArticleHeader({ post }: { post: PostFull }) {
  const publishDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  return (
    <header className="mb-10">
      {/* Category + Genre */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {post.category && (
          <Link
            href={`/blog?category=${post.category.slug}`}
            className="category-pill text-[var(--accent)] border border-[var(--accent)]"
            style={{ borderColor: post.category.color ?? undefined, color: post.category.color ?? undefined }}
          >
            {post.category.name}
          </Link>
        )}
        {(() => {
          const formSlug = FORMS.find(f => f.genre === post.genre)?.slug;
          const label = GENRE_LABELS[post.genre] || post.genre;
          return formSlug ? (
            <Link
              href={`/blog?form=${formSlug}`}
              className="category-pill bg-[var(--bg-secondary)] text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
            >
              {label}
            </Link>
          ) : (
            <span className="category-pill bg-[var(--bg-secondary)] text-[var(--text-faint)]">{label}</span>
          );
        })()}
        {post.humour && (
          <span
            className="category-pill"
            style={{ backgroundColor: `${post.humour.color}22`, color: post.humour.color ?? undefined }}
          >
            {post.humour.name}
          </span>
        )}
      </div>

      {/* Title */}
      <h1
        className="text-4xl md:text-5xl font-bold leading-tight text-[var(--text-primary)] mb-6"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        {post.title}
      </h1>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="text-xl text-[var(--text-muted)] leading-relaxed mb-8 border-l-2 border-[var(--accent)] pl-5"
           style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}>
          {post.excerpt}
        </p>
      )}

      {/* Author + Meta */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {post.author.image ? (
            <Image
              src={post.author.image} alt={post.author.name ?? ''}
              width={44} height={44}
              className="rounded-full border border-[var(--border)]"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-sans font-medium">
              {post.author.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {post.author.name}
            </p>
            <time className="text-xs text-[var(--text-faint)] font-sans" dateTime={publishDate.toISOString()}>
              {format(publishDate, 'MMMM d, yyyy')}
            </time>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs font-sans text-[var(--text-faint)]">
          {post.readingTime && (
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> {post.readingTime} min read
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Eye size={13} /> {post._count?.upvotes ?? 0} upvotes
          </span>
          <span className="flex items-center gap-1.5">
            <BookOpen size={13} /> {post._count?.comments ?? 0} comments
          </span>
        </div>
      </div>

      {/* Cover image */}
      {post.coverImage && (
        <div className="mt-8 aspect-[21/9] relative overflow-hidden rounded-sm">
          <Image
            src={post.coverImage} alt={post.coverAlt ?? post.title}
            fill className="object-cover"
            priority sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
      )}
    </header>
  );
}
