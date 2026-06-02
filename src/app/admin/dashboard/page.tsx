// src/app/admin/dashboard/page.tsx
// Admin dashboard: overview stats, pending suggestions, recent posts.
// Protected – server-side auth check redirects non-admins.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PenLine, Users, MessageSquare, FileText, Edit3, CheckCircle, Clock } from 'lucide-react';

async function getStats() {
  const [postCount, userCount, commentCount, pendingSuggestions, recentPosts] = await Promise.all([
    prisma.post.count(),
    prisma.user.count(),
    prisma.comment.count({ where: { deleted: false } }),
    prisma.suggestion.findMany({
      where: { status: 'PENDING' },
      include: { post: { select: { title: true, slug: true } }, author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.post.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { name: true } },
        _count: { select: { upvotes: true, comments: true } },
      },
    }),
  ]);
  return { postCount, userCount, commentCount, pendingSuggestions, recentPosts };
}

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'ADMIN') redirect('/');

  const { postCount, userCount, commentCount, pendingSuggestions, recentPosts } = await getStats();

  const STAT_CARDS = [
    { label: 'Total Posts',    value: postCount,     icon: FileText,     color: 'text-blue-500'   },
    { label: 'Registered Users', value: userCount,   icon: Users,        color: 'text-green-500'  },
    { label: 'Comments',       value: commentCount,  icon: MessageSquare,color: 'text-purple-500' },
    { label: 'Pending Reviews',value: pendingSuggestions.length, icon: Edit3, color: 'text-amber-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="section-title">Admin Dashboard</h1>
        <Link href="/admin/editor"
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] transition-colors">
          <PenLine size={15} /> New Post
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-[var(--border)] p-5 bg-[var(--bg-secondary)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-sans font-medium uppercase tracking-widest text-[var(--text-faint)]">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <p className="text-3xl font-bold" style={{ fontFamily: 'var(--font-cormorant)' }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Pending suggestions */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
            <Edit3 size={18} className="text-amber-500" /> Pending Suggestions
          </h2>
          {pendingSuggestions.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-[var(--text-faint)] font-sans p-4 border border-[var(--border)]">
              <CheckCircle size={15} className="text-green-500" /> All caught up!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingSuggestions.map(s => (
                <div key={s.id} className="border border-[var(--border)] p-4 bg-[var(--bg-secondary)]">
                  <p className="text-sm font-medium line-clamp-1 mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
                    {s.post.title}
                  </p>
                  <p className="text-xs text-[var(--text-faint)] font-sans mb-2">
                    By {s.author?.name ?? s.guestName ?? 'Anonymous'} · {format(s.createdAt, 'MMM d')}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-sans line-clamp-2 bg-[var(--bg-tertiary)] p-2 rounded">
                    {s.suggestedText}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/admin/suggestions/${s.id}`}
                      className="text-xs font-sans px-3 py-1.5 bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] transition-colors">
                      Review
                    </Link>
                    <Link href={`/blog/${s.post.slug}`} target="_blank"
                      className="text-xs font-sans px-3 py-1.5 border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] transition-colors">
                      View Post
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent posts */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
            <FileText size={18} className="text-blue-500" /> Recent Posts
          </h2>
          <div className="space-y-2">
            {recentPosts.map(post => (
              <div key={post.id} className="flex items-center justify-between gap-4 p-3 border border-[var(--border)] group hover:border-[var(--accent)] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${post.published ? 'bg-green-400' : 'bg-amber-400'}`} title={post.published ? 'Published' : 'Draft'} />
                  <span className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-cormorant)' }}>{post.title}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-[var(--text-faint)] font-sans hidden sm:block">{format(post.createdAt, 'MMM d')}</span>
                  <Link href={`/admin/editor?id=${post.id}`}
                    className="text-xs font-sans text-[var(--accent)] hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
