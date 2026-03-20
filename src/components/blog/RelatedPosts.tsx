// src/components/blog/RelatedPosts.tsx
import PostCard from './PostCard';
import type { PostSummary } from '@/types';

export default function RelatedPosts({ posts }: { posts: PostSummary[] }) {
  return (
    <section aria-label="Related posts">
      <h2 className="section-title mb-8">Continue Reading</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {posts.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
      </div>
    </section>
  );
}
