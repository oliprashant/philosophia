// src/components/home/FeaturedPost.tsx
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Clock, ArrowRight } from 'lucide-react';
import type { PostSummary } from '@/types';

export default function FeaturedPost({ post }: { post: PostSummary }) {
  const publishDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  return (
    <section aria-label="Featured post">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="section-title">Featured</h2>
        <span className="text-xs font-sans text-[var(--gold)] uppercase tracking-widest border border-[var(--gold)] px-3 py-1">
          Editor's Choice
        </span>
      </div>

      <Link
        href={`/blog/${post.slug}`}
        className="group grid md:grid-cols-2 gap-0 border border-[var(--border)] hover:border-[var(--accent)] transition-colors overflow-hidden"
      >
        {/* Image side */}
        <div className="aspect-[4/3] md:aspect-auto relative overflow-hidden bg-[var(--bg-tertiary)]">
          {post.coverImage ? (
            <Image
              src={post.coverImage} alt={post.coverAlt ?? post.title}
              fill className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw" priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-8xl text-[var(--border)]" style={{ fontFamily: 'var(--font-cormorant)' }}>φ</span>
            </div>
          )}
        </div>

        {/* Content side */}
        <div className="p-8 md:p-12 flex flex-col justify-center bg-[var(--bg-secondary)]">
          {post.category && (
            <span
              className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: post.category.color ?? 'var(--accent)' }}
            >
              {post.category.name}
            </span>
          )}

          <h3
            className="text-3xl md:text-4xl font-bold leading-tight text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors mb-4"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            {post.title}
          </h3>

          {post.excerpt && (
            <p className="text-[var(--text-muted)] leading-relaxed mb-6 line-clamp-3"
               style={{ fontFamily: 'var(--font-lora)', fontStyle: 'italic' }}>
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
              {post.author.image && (
                <Image src={post.author.image} alt={post.author.name ?? ''} width={36} height={36} className="rounded-full" />
              )}
              <div>
                <p className="text-sm font-medium">{post.author.name}</p>
                <div className="flex items-center gap-2 text-xs text-[var(--text-faint)] font-sans">
                  <time>{format(publishDate, 'MMM d, yyyy')}</time>
                  {post.readingTime && <><span>·</span><span className="flex items-center gap-1"><Clock size={10} /> {post.readingTime} min</span></>}
                </div>
              </div>
            </div>

            <span className="flex items-center gap-1.5 text-sm font-sans font-medium text-[var(--accent)] group-hover:gap-3 transition-all">
              Read <ArrowRight size={15} />
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
