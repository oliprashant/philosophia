// src/components/blog/PostGrid.tsx
import PostCard from './PostCard';
import type { PostSummary } from '@/types';

export default function PostGrid({ posts }: { posts: PostSummary[] }) {
  if (!posts.length) return (
    <p className="text-[var(--text-faint)] font-sans text-sm text-center py-12 col-span-full italic"
       style={{ fontFamily: 'var(--font-cormorant)' }}>
      No posts found.
    </p>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {posts.map((post, i) => (
        <PostCard key={post.id} post={post} index={i} />
      ))}
    </div>
  );
}
