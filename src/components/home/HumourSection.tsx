// src/components/home/HumourSection.tsx
import Link from 'next/link';
import PostCard from '@/components/blog/PostCard';
import type { PostSummary } from '@/types';

interface Humour { id: string; name: string; slug: string; description: string | null; color: string | null }

export default function HumourSection({ humour, posts }: { humour: Humour; posts: PostSummary[] }) {
  return (
    <section aria-label={`${humour.name} posts`}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Colour blob */}
          <div className="w-1 h-12 rounded-full" style={{ backgroundColor: humour.color ?? '#6B1E3C' }} />
          <div>
            <h2 className="section-title">{humour.name}</h2>
            {humour.description && (
              <p className="text-sm text-[var(--text-faint)] font-sans mt-0.5 max-w-md">{humour.description}</p>
            )}
          </div>
        </div>
        <Link
          href={`/blog?humour=${humour.slug}`}
          className="text-xs font-sans text-[var(--accent)] hover:underline whitespace-nowrap mt-1"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
      </div>
    </section>
  );
}
