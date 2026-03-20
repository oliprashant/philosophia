// src/app/profile/page.tsx
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My Profile' };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/signin?callbackUrl=/profile');

  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        where: { published: true },
        take: 5,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, title: true, slug: true, publishedAt: true, _count: { select: { upvotes: true } } },
      },
      comments: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { post: { select: { title: true, slug: true } } },
      },
      _count: { select: { posts: true, comments: true, upvotes: true } },
    },
  });

  if (!user) redirect('/');

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      {/* Profile header */}
      <div className="flex items-start gap-6 mb-12">
        {user.image ? (
          <Image src={user.image} alt={user.name ?? ''} width={80} height={80} className="rounded-full border-2 border-[var(--border)]" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-3xl font-sans">
            {user.name?.[0]?.toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>{user.name}</h1>
          <p className="text-sm text-[var(--text-faint)] font-sans mb-2">{user.email}</p>
          {user.bio && <p className="text-sm text-[var(--text-muted)] font-sans leading-relaxed">{user.bio}</p>}
          <div className="flex gap-6 mt-4">
            {[
              { label: 'Posts', value: user._count.posts },
              { label: 'Comments', value: user._count.comments },
              { label: 'Upvotes given', value: user._count.upvotes },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold" style={{ fontFamily: 'var(--font-cormorant)' }}>{value}</p>
                <p className="text-xs text-[var(--text-faint)] font-sans">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent posts */}
      {user.posts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
            My Essays
          </h2>
          <div className="space-y-3">
            {user.posts.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="flex items-center justify-between p-4 border border-[var(--border)] hover:border-[var(--accent)] transition-colors group">
                <span className="text-sm font-medium group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {post.title}
                </span>
                <div className="flex items-center gap-3 text-xs font-sans text-[var(--text-faint)]">
                  <span>↑ {post._count.upvotes}</span>
                  {post.publishedAt && <time>{format(new Date(post.publishedAt), 'MMM d, yyyy')}</time>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent comments */}
      {user.comments.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Recent Comments
          </h2>
          <div className="space-y-3">
            {user.comments.map((comment: any) => (
              <div key={comment.id} className="border border-[var(--border)] p-4">
                <Link href={`/blog/${comment.post.slug}`}
                  className="text-xs font-sans font-medium text-[var(--accent)] hover:underline block mb-2">
                  On: {comment.post.title}
                </Link>
                <p className="text-sm text-[var(--text-secondary)] font-sans line-clamp-2">{comment.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
