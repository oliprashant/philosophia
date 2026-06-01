'use client';

import Image from 'next/image';
import { format } from 'date-fns';
import { Clock, Eye, BookOpen, BadgeCheck } from 'lucide-react';

type PreviewPost = {
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  coverAlt: string | null;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  author: {
    name: string | null;
    image: string | null;
  };
  readingTime?: number | null;
};

export default function PostPreviewArticle({ post }: { post: PreviewPost }) {
  const publishDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <span className="category-pill bg-[var(--bg-secondary)] text-[var(--text-faint)]">
            Preview
          </span>
          {post.featured && (
            <span className="category-pill bg-[var(--accent)]/10 text-[var(--accent)] flex items-center gap-1">
              <BadgeCheck size={12} /> Featured
            </span>
          )}
        </div>

        <h1
          className="text-4xl md:text-5xl font-bold leading-tight text-[var(--text-primary)] mb-6"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          {post.title}
        </h1>

        {post.excerpt && (
          <p
            className="text-xl text-[var(--text-muted)] leading-relaxed mb-8 border-l-2 border-[var(--accent)] pl-5"
            style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic' }}
          >
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {post.author.image ? (
              <Image
                src={post.author.image}
                alt={post.author.name ?? 'Author'}
                width={44}
                height={44}
                className="rounded-full border border-[var(--border)]"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[var(--accent)] text-white flex items-center justify-center font-sans font-medium">
                {post.author.name?.[0]?.toUpperCase() || 'A'}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{post.author.name || 'Admin'}</p>
              <time className="text-xs text-[var(--text-faint)] font-sans" dateTime={publishDate.toISOString()}>
                {post.publishedAt ? format(publishDate, 'MMMM d, yyyy') : 'Draft preview'}
              </time>
            </div>
          </div>

          <div className="flex items-center gap-5 text-xs font-sans text-[var(--text-faint)]">
            {post.readingTime ? (
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {post.readingTime} min read
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <Eye size={13} /> Preview
            </span>
            <span className="flex items-center gap-1.5">
              <BookOpen size={13} /> Live styling
            </span>
          </div>
        </div>

        {post.coverImage && (
          <div className="mt-8 aspect-[21/9] relative overflow-hidden rounded-sm">
            <Image
              src={post.coverImage}
              alt={post.coverAlt ?? post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </div>
        )}
      </header>

      <div className="prose prose-philosophia dark:prose-invert max-w-none">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </article>
  );
}
