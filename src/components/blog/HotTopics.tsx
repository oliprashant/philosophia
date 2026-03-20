// src/components/blog/HotTopics.tsx
import Link from 'next/link';
import { Flame, ArrowUpCircle } from 'lucide-react';
import type { PostSummary } from '@/types';

export default function HotTopics({ posts }: { posts: PostSummary[] }) {
  return (
    <section aria-label="Hot topics today">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="section-title flex items-center gap-2">
          <Flame size={20} className="text-orange-500" /> Hot Today
        </h2>
        <span className="text-xs font-sans text-[var(--text-faint)]">Most discussed in the last 24 hours</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className={`group relative p-5 border border-[var(--border)] hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all ${i === 0 ? 'hot-glow sm:col-span-2' : ''}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl font-bold text-[var(--border)] group-hover:text-orange-300 transition-colors font-sans" style={{ fontFamily: 'var(--font-cormorant)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug text-[var(--text-primary)] group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {post.title}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs font-sans text-[var(--text-faint)]">
                  <ArrowUpCircle size={11} className="text-orange-500" />
                  {post._count.upvotes} upvotes · {post._count.comments} comments
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
