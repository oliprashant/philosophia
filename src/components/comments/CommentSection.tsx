'use client';
// src/components/comments/CommentSection.tsx
// Full comment section with:
// - Anonymous + authenticated comments
// - Threaded replies (lazy-loaded)
// - Upvoting
// - Edit / delete for own comments
// - Pagination for initial load

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, ThumbsUp, Reply, MoreHorizontal, Trash2, Loader2, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import type { CommentWithAuthor } from '@/types';

// ── Single comment with lazy-loaded replies ────────────────────────────────────
function Comment({
  comment, userId, depth = 0,
  onReply, onDelete, expanded, onToggleReplies,
}: {
  comment: CommentWithAuthor;
  userId: string | null;
  depth?: number;
  onReply: (parentId: string, parentName: string) => void;
  onDelete: (id: string) => void;
  expanded?: boolean;
  onToggleReplies?: (id: string) => void;
}) {
  const [upvoted, setUpvoted] = useState(false);
  const [upvoteCount, setUpvoteCount] = useState(comment._count.upvotes);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replies, setReplies] = useState(comment.replies ?? []);
  const [showReplies, setShowReplies] = useState(expanded ?? false);

  const isOwn = userId && comment.author?.id === userId;
  const displayName = comment.author?.name ?? comment.guestName ?? 'Anonymous';
  const replyCount = comment._count?.replies ?? 0;

  const handleUpvote = async () => {
    if (upvoted) return;
    setUpvoted(true);
    setUpvoteCount(c => c + 1);
    await fetch('/api/upvotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commentId: comment.id }),
    }).catch(() => { setUpvoted(false); setUpvoteCount(c => c - 1); });
  };

  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
    } else if (replies.length === 0 && replyCount > 0) {
      // Need to fetch replies
      setLoadingReplies(true);
      try {
        const res = await fetch(`/api/comments/${comment.id}/replies?depth=3`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReplies(data.replies ?? []);
      } catch {
        toast.error('Could not load replies');
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(true);
  };

  if (comment.deleted) {
    return (
      <div className={`${depth > 0 ? 'ml-8 border-l border-[var(--border)] pl-4' : ''} py-3`}>
        <p className="text-xs font-sans text-[var(--text-faint)] italic">[Comment removed]</p>
        {replies?.map(r => (
          <Comment key={r.id} comment={r} userId={userId} depth={depth + 1} onReply={onReply} onDelete={onDelete} />
        ))}
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-[var(--border)] pl-4' : ''}`}>
      <div className="py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            {comment.author?.image ? (
              <Image src={comment.author.image} alt={displayName} width={32} height={32} className="rounded-full shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-xs font-sans text-[var(--text-muted)] shrink-0">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-[var(--text-primary)]">{displayName}</span>
                <time className="text-xs text-[var(--text-faint)] font-sans" suppressHydrationWarning>
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </time>
              </div>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed font-sans">
                {comment.content}
              </p>
              {/* Actions */}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <button
                  onClick={handleUpvote}
                  disabled={upvoted}
                  className={`flex items-center gap-1 text-xs font-sans transition-colors ${upvoted ? 'text-[var(--accent)]' : 'text-[var(--text-faint)] hover:text-[var(--accent)]'}`}
                >
                  <ThumbsUp size={12} /> {upvoteCount > 0 ? upvoteCount : ''}
                </button>
                {depth < 3 && (
                  <button
                    onClick={() => onReply(comment.id, displayName)}
                    className="flex items-center gap-1 text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Reply size={12} /> Reply
                  </button>
                )}
                {replyCount > 0 && (
                  <button
                    onClick={handleToggleReplies}
                    disabled={loadingReplies}
                    className="flex items-center gap-1 text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
                  >
                    {loadingReplies ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <>
                        <ChevronDown size={12} className={`transition-transform ${showReplies ? 'rotate-180' : ''}`} />
                        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                      </>
                    )}
                  </button>
                )}
                {isOwn && (
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="flex items-center gap-1 text-xs font-sans text-[var(--text-faint)] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {showReplies && replies?.map(r => (
        <Comment key={r.id} comment={r} userId={userId} depth={depth + 1} onReply={onReply} onDelete={onDelete} expanded />
      ))}
    </div>
  );
}

// ── Comment form ───────────────────────────────────────────────────────────────
function CommentForm({
  postId, userId, userName, parentId, replyingTo,
  onCancel, onSuccess,
}: {
  postId: string;
  userId: string | null;
  userName: string | null;
  parentId?: string | null;
  replyingTo?: string;
  onCancel?: () => void;
  onSuccess: (comment: CommentWithAuthor) => void;
}) {
  const [content, setContent] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    if (!userId && !guestName.trim()) { toast.error('Please enter your name'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content, parentId: parentId ?? null, guestName: guestName || undefined, guestEmail: guestEmail || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onSuccess(data.comment);
      setContent('');
      setGuestName('');
      setGuestEmail('');
      onCancel?.();
    } catch {
      toast.error('Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {replyingTo && (
        <p className="text-xs font-sans text-[var(--text-faint)]">
          Replying to <span className="text-[var(--accent)]">{replyingTo}</span>
        </p>
      )}
      {!userId && (
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text" placeholder="Your name *" value={guestName}
            onChange={e => setGuestName(e.target.value)}
            className="px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
          <input
            type="email" placeholder="Email (optional)" value={guestEmail}
            onChange={e => setGuestEmail(e.target.value)}
            className="px-3 py-2 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
      )}
      <textarea
        value={content} onChange={e => setContent(e.target.value)}
        placeholder={userId ? `What are your thoughts, ${userName?.split(' ')[0] ?? 'reader'}?` : 'Share your thoughts…'}
        rows={3}
        className="w-full px-4 py-3 text-sm font-sans bg-[var(--bg-secondary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
      />
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            Cancel
          </button>
        )}
        <button
          onClick={submit} disabled={!content.trim() || submitting}
          className="px-5 py-2 text-sm font-sans font-medium bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Post Comment'}
        </button>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
interface CommentSectionProps {
  postId: string;
  userId: string | null;
  userName: string | null;
  initialComments?: CommentWithAuthor[];
}

export default function CommentSection({
  postId, userId, userName, initialComments = [],
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, pages: 1, hasMore: false });
  const [loading, setLoading] = useState(initialComments.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  // Load initial comments if not provided
  useEffect(() => {
    if (initialComments.length > 0) {
      setLoading(false);
      return;
    }

    fetch(`/api/comments?postId=${postId}&page=1`)
      .then(r => r.json())
      .then(d => {
        setComments(d.comments ?? []);
        setPagination(d.pagination ?? { page: 1, limit: 30, total: 0, pages: 1, hasMore: false });
      })
      .catch(() => {
        setComments([]);
      })
      .finally(() => setLoading(false));
  }, [postId, initialComments]);

  const handleLoadMore = async () => {
    const nextPage = pagination.page + 1;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/comments?postId=${postId}&page=${nextPage}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(prev => [...prev, ...(data.comments ?? [])]);
      setPagination(data.pagination ?? { page: nextPage, limit: 30, total: 0, pages: 1, hasMore: false });
    } catch {
      toast.error('Could not load more comments');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNewComment = (comment: CommentWithAuthor) => {
    if (comment.parentId) {
      // Nest reply under parent - find it in comments tree
      const updateCommentTree = (comments: CommentWithAuthor[]): CommentWithAuthor[] => {
        return comments.map(c => {
          if (c.id === comment.parentId) {
            return { ...c, replies: [...(c.replies ?? []), comment] };
          }
          if (c.replies?.length) {
            return { ...c, replies: updateCommentTree(c.replies) };
          }
          return c;
        });
      };
      setComments(updateCommentTree(comments));
    } else {
      setComments(prev => [comment, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    const softDelete = (comments: CommentWithAuthor[]): CommentWithAuthor[] =>
      comments.map(c => c.id === id ? { ...c, deleted: true } : { ...c, replies: c.replies ? softDelete(c.replies) : undefined });
    setComments(softDelete(comments));
  };

  const topLevel = comments.filter(c => !c.parentId);

  return (
    <section className="mt-16" aria-label="Comments">
      <h2 className="section-title mb-8 flex items-center gap-3">
        <MessageSquare size={22} className="text-[var(--accent)]" />
        Discussion
        {!loading && <span className="text-lg text-[var(--text-faint)] font-sans font-normal">({pagination.total})</span>}
      </h2>

      {/* Top-level form */}
      <div className="mb-10 p-6 border border-[var(--border)] bg-[var(--bg-secondary)]">
        <CommentForm
          postId={postId} userId={userId} userName={userName}
          onSuccess={handleNewComment}
        />
      </div>

      {/* Comment list */}
      {loading ? (
        <div className="flex items-center gap-2 text-[var(--text-faint)] py-6">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm font-sans">Loading discussion…</span>
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm font-sans text-[var(--text-faint)] text-center py-8 italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
          No comments yet. Begin the dialogue.
        </p>
      ) : (
        <>
          <div className="divide-y divide-[var(--border)]">
            {topLevel.map(comment => (
              <div key={comment.id}>
                <Comment
                  comment={comment} userId={userId}
                  onReply={(id, name) => setReplyTo({ id, name })}
                  onDelete={handleDelete}
                />
                {/* Reply form */}
                {replyTo?.id === comment.id && (
                  <div className="ml-8 mb-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <CommentForm
                      postId={postId} userId={userId} userName={userName}
                      parentId={comment.id} replyingTo={replyTo.name}
                      onCancel={() => setReplyTo(null)}
                      onSuccess={c => { handleNewComment(c); setReplyTo(null); }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Load more button */}
          {pagination.hasMore && (
            <div className="flex justify-center py-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors"
              >
                {loadingMore ? (
                  <Loader2 size={14} className="animate-spin inline mr-2" />
                ) : null}
                Load more comments
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
