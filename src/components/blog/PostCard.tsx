// src/components/blog/PostCard.tsx
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Clock, ArrowUpCircle, MessageSquare } from 'lucide-react';
import type { PostSummary } from '@/types';

const GENRE_ICONS: Record<string, string> = {
  ESSAY: '✦', DIALOGUE: '◇', POEM: '◈', APHORISM: '—',
  LETTER: '◻', REVIEW: '◉', INTERVIEW: '◎',
};

export default function PostCard({ post, index = 0 }: { post: PostSummary; index?: number }) {
  const publishDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);

  return (
    <article
      className="post-card group flex flex-col border border-[var(--border)] hover:border-[var(--accent)] transition-all duration-300 bg-[var(--bg-primary)] overflow-hidden"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Cover image */}
      {post.coverImage && (
        <div className="aspect-[16/9] relative overflow-hidden">
          <Image
            src={post.coverImage} alt={post.coverAlt ?? post.title}
            fill className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Humour badge */}
          {post.humour && (
            <span
              className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-sans font-medium uppercase tracking-widest text-white rounded-full"
              style={{ backgroundColor: post.humour.color ?? '#6B1E3C' }}
            >
              {post.humour.name}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 p-6">
        {/* Category + Genre */}
        <div className="flex items-center gap-2 mb-3">
          {post.category && (
            <span
              className="text-[10px] font-sans font-semibold uppercase tracking-widest"
              style={{ color: post.category.color ?? 'var(--accent)' }}
            >
              {post.category.name}
            </span>
          )}
          {post.category && <span className="text-[var(--border)] text-xs">·</span>}
          <span className="text-[10px] font-sans text-[var(--text-faint)] uppercase tracking-widest">
            {GENRE_ICONS[post.genre]} {post.genre}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 flex-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
          <Link
            href={`/blog/${post.slug}`}
            className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2"
          >
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-3 mb-4 font-sans">
            {post.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            {post.author.image ? (
              <Image src={post.author.image} alt={post.author.name ?? ''} width={24} height={24} className="rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[10px] flex items-center justify-center font-sans">
                {post.author.name?.[0]}
              </div>
            )}
            <span className="text-xs font-sans text-[var(--text-muted)]">{post.author.name}</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-sans text-[var(--text-faint)]">
            {post.readingTime && (
              <span className="flex items-center gap-1"><Clock size={11} /> {post.readingTime}m</span>
            )}
            <span className="flex items-center gap-1"><ArrowUpCircle size={11} /> {post._count.upvotes}</span>
            <span className="flex items-center gap-1"><MessageSquare size={11} /> {post._count.comments}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
