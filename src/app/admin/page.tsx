'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Users,
  Settings,
  Loader,
  Edit2,
  Trash2,
  Plus,
  Eye,
  Search,
  X,
  Menu,
  BarChart3,
  Upload,
  Check,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TabKey = 'dashboard' | 'posts' | 'comments';
type MenuKey = TabKey | 'users' | 'settings';
type CommentStatus = 'Approved' | 'Pending' | 'Spam';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string | null;
  category: string;
  author: { name: string };
  status: 'Published' | 'Draft';
  views: number;
  createdAt: string;
  metaTitle: string;
  metaDescription: string;
}

interface Comment {
  id: string;
  text: string;
  author: { name: string };
  post: { title: string; slug: string };
  status: CommentStatus;
  createdAt: string;
}

interface Stats {
  totalPosts: number;
  totalComments: number;
  totalUsers: number;
  totalViews: number;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface PostFormState {
  id: string | null;
  title: string;
  slug: string;
  categoryId: string;
  excerpt: string;
  content: string;
  image: string;
  metaTitle: string;
  metaDescription: string;
  status: 'Published' | 'Draft';
}

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'posts', label: 'Posts' },
  { key: 'comments', label: 'Comments' },
];

const SIDEBAR_ITEMS: Array<{ key: MenuKey; label: string; icon: any; tab?: TabKey }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, tab: 'dashboard' },
  { key: 'posts', label: 'Posts', icon: FileText, tab: 'posts' },
  { key: 'comments', label: 'Comments', icon: MessageSquare, tab: 'comments' },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'settings', label: 'Settings', icon: Settings },
];

const EMPTY_STATS: Stats = {
  totalPosts: 0,
  totalComments: 0,
  totalUsers: 0,
  totalViews: 0,
};

const EMPTY_POST_FORM: PostFormState = {
  id: null,
  title: '',
  slug: '',
  categoryId: '',
  excerpt: '',
  content: '',
  image: '',
  metaTitle: '',
  metaDescription: '',
  status: 'Draft',
};

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function truncate(value: string, max = 100): string {
  if (!value) return '';
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [activeMenu, setActiveMenu] = useState<MenuKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingPost, setSavingPost] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState<PostFormState>(EMPTY_POST_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetType, setDeleteTargetType] = useState<'post' | 'comment'>('post');

  const [postSearchTerm, setPostSearchTerm] = useState('');
  const [commentSearchTerm, setCommentSearchTerm] = useState('');
  const [commentStatusFilter, setCommentStatusFilter] = useState<'All' | CommentStatus>('All');

  const [currentPostPage, setCurrentPostPage] = useState(1);
  const postsPerPage = 10;

  const [selectedCommentIds, setSelectedCommentIds] = useState<string[]>([]);

  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || !isAdmin) {
      router.replace('/');
    }
  }, [session, status, isAdmin, router]);

  const normalizePost = (raw: any): Post => {
    return {
      id: raw.id,
      title: raw.title ?? '',
      slug: raw.slug ?? '',
      excerpt: raw.excerpt ?? '',
      content: raw.content ?? '',
      image: raw.coverImage ?? null,
      category: raw.category?.name ?? 'Uncategorized',
      author: { name: raw.author?.name ?? 'Unknown' },
      status: raw.published ? 'Published' : 'Draft',
      views: Number(raw.viewCount ?? 0),
      createdAt: raw.createdAt ?? new Date().toISOString(),
      metaTitle: raw.title ?? '',
      metaDescription: raw.excerpt ?? '',
    };
  };

  const normalizeComment = (raw: any): Comment => {
    return {
      id: raw.id,
      text: raw.text ?? raw.content ?? '',
      author: { name: raw.author?.name ?? raw.guestName ?? 'Anonymous' },
      post: {
        title: raw.post?.title ?? 'Untitled Post',
        slug: raw.post?.slug ?? '',
      },
      status: (raw.status as CommentStatus) ?? (raw.deleted ? 'Spam' : 'Approved'),
      createdAt: raw.createdAt ?? new Date().toISOString(),
    };
  };

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [statsRes, postsRes, commentsRes, categoriesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/posts?admin=true&limit=100'),
        fetch('/api/comments?admin=true'),
        fetch('/api/categories'),
      ]);

      if (!postsRes.ok || !commentsRes.ok) {
        throw new Error('Core admin data failed to load');
      }

      const postsData = await postsRes.json();
      const commentsData = await commentsRes.json();

      const normalizedPosts = (postsData.items ?? []).map(normalizePost);
      const normalizedComments = (commentsData.comments ?? []).map(normalizeComment);

      setPosts(normalizedPosts);
      setComments(normalizedComments);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalPosts: statsData.totalPosts ?? 0,
          totalComments: statsData.totalComments ?? 0,
          totalUsers: statsData.totalUsers ?? 0,
          totalViews: statsData.totalViews ?? 0,
        });
      } else {
        // Fallback when stats endpoint is unavailable
        const totalViews = normalizedPosts.reduce((sum: number, p: Post) => sum + p.views, 0);
        setStats({
          totalPosts: normalizedPosts.length,
          totalComments: normalizedComments.length,
          totalUsers: 0,
          totalViews,
        });
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories ?? []);
      }
    } catch (error) {
      console.error('[Admin fetchAll]', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'authenticated' || !isAdmin) return;
    fetchAll();
  }, [status, isAdmin]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) =>
      post.title.toLowerCase().includes(postSearchTerm.trim().toLowerCase())
    );
  }, [posts, postSearchTerm]);

  const postPageCount = Math.max(1, Math.ceil(filteredPosts.length / postsPerPage));

  useEffect(() => {
    if (currentPostPage > postPageCount) {
      setCurrentPostPage(postPageCount);
    }
  }, [currentPostPage, postPageCount]);

  const paginatedPosts = useMemo(() => {
    const start = (currentPostPage - 1) * postsPerPage;
    return filteredPosts.slice(start, start + postsPerPage);
  }, [filteredPosts, currentPostPage]);

  const filteredComments = useMemo(() => {
    return comments
      .filter((comment) => {
        if (commentStatusFilter === 'All') return true;
        return comment.status === commentStatusFilter;
      })
      .filter((comment) =>
        comment.text.toLowerCase().includes(commentSearchTerm.trim().toLowerCase())
      );
  }, [comments, commentStatusFilter, commentSearchTerm]);

  const openCreateForm = () => {
    setEditingPost(null);
    setPostForm(EMPTY_POST_FORM);
    setSlugTouched(false);
    setShowPostForm(true);
  };

  const openEditForm = (post: Post) => {
    setEditingPost(post);
    setPostForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      categoryId: categories.find((c) => c.name === post.category)?.id ?? '',
      excerpt: post.excerpt,
      content: post.content,
      image: post.image ?? '',
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
      status: post.status,
    });
    setSlugTouched(true);
    setShowPostForm(true);
  };

  const handlePublishToggle = async (postId: string, nextStatus: 'Published' | 'Draft') => {
    const published = nextStatus === 'Published';
    const prevPosts = posts;

    setPosts((curr) => curr.map((post) => (post.id === postId ? { ...post, status: nextStatus } : post)));

    try {
      let res = await fetch(`/api/posts/${postId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published }),
      });

      // Fallback to base post PATCH if publish route is unavailable
      if (!res.ok && res.status === 404) {
        res = await fetch(`/api/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ published }),
        });
      }

      if (!res.ok) throw new Error('Failed to update post status');

      toast.success(published ? 'Post published' : 'Post moved to draft');
    } catch (error) {
      console.error('[Admin handlePublishToggle]', error);
      setPosts(prevPosts);
      toast.error('Could not update publish status');
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setPosts((curr) => curr.filter((post) => post.id !== postId));
      setStats((curr) => ({ ...curr, totalPosts: Math.max(0, curr.totalPosts - 1) }));
      toast.success('Post deleted');
    } catch (error) {
      console.error('[Admin handleDeletePost]', error);
      toast.error('Could not delete post');
    }
  };

  const handleCommentStatus = async (commentId: string, statusValue: CommentStatus) => {
    const prev = comments;
    setComments((curr) => curr.map((comment) => (comment.id === commentId ? { ...comment, status: statusValue } : comment)));

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusValue }),
      });

      if (!res.ok) throw new Error('Failed to update comment status');
      toast.success(`Comment marked as ${statusValue}`);
    } catch (error) {
      console.error('[Admin handleCommentStatus]', error);
      setComments(prev);
      toast.error('Could not update comment');
    }
  };

  const handleApproveComment = (commentId: string) => handleCommentStatus(commentId, 'Approved');

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      setComments((curr) => curr.filter((comment) => comment.id !== commentId));
      setSelectedCommentIds((curr) => curr.filter((id) => id !== commentId));
      setStats((curr) => ({ ...curr, totalComments: Math.max(0, curr.totalComments - 1) }));
      toast.success('Comment deleted');
    } catch (error) {
      console.error('[Admin handleDeleteComment]', error);
      toast.error('Could not delete comment');
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedCommentIds.length) return;

    for (const id of selectedCommentIds) {
      // Sequential updates to avoid overwhelming API in low-resource hosts.
      // eslint-disable-next-line no-await-in-loop
      await handleCommentStatus(id, 'Approved');
    }

    setSelectedCommentIds([]);
  };

  const handleBulkDelete = async () => {
    if (!selectedCommentIds.length) return;

    for (const id of selectedCommentIds) {
      // eslint-disable-next-line no-await-in-loop
      await handleDeleteComment(id);
    }

    setSelectedCommentIds([]);
  };

  const openDeleteConfirm = (type: 'post' | 'comment', id: string) => {
    setDeleteTargetType(type);
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    const id = deleteTargetId;
    const type = deleteTargetType;

    setShowDeleteConfirm(false);
    setDeleteTargetId(null);

    if (type === 'post') {
      await handleDeletePost(id);
      return;
    }

    await handleDeleteComment(id);
  };

  const handlePostFormChange = (field: keyof PostFormState, value: string) => {
    setPostForm((curr) => ({ ...curr, [field]: value }));

    if (field === 'title' && !slugTouched) {
      setPostForm((curr) => ({ ...curr, slug: toSlug(value) }));
    }

    if (field === 'slug') {
      setSlugTouched(true);
    }
  };

  const uploadFeaturedImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append('file', file);
      data.append('type', 'cover');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      if (!res.ok) throw new Error('Upload failed');

      const payload = await res.json();
      setPostForm((curr) => ({ ...curr, image: payload.url ?? '' }));
      toast.success('Image uploaded');
    } catch (error) {
      console.error('[Admin uploadFeaturedImage]', error);
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const applyWrap = (before: string, after: string = before) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = postForm.content.slice(start, end) || 'text';

    const nextContent =
      postForm.content.slice(0, start) +
      `${before}${selected}${after}` +
      postForm.content.slice(end);

    setPostForm((curr) => ({ ...curr, content: nextContent }));
  };

  const applyBlock = (prefix: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = postForm.content.slice(start, end) || 'text';
    const lines = selected.split('\n').map((line) => `${prefix}${line}`).join('\n');

    const nextContent = postForm.content.slice(0, start) + lines + postForm.content.slice(end);
    setPostForm((curr) => ({ ...curr, content: nextContent }));
  };

  const insertLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    applyWrap(`<a href="${url}">`, '</a>');
  };

  const handleSavePost = async () => {
    if (!postForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!postForm.content.trim()) {
      toast.error('Content is required');
      return;
    }

    setSavingPost(true);

    try {
      const payload = {
        title: postForm.title,
        excerpt: postForm.excerpt,
        content: postForm.content,
        coverImage: postForm.image || undefined,
        categoryId: postForm.categoryId || undefined,
        published: postForm.status === 'Published',
        genre: 'ESSAY',
        slug: postForm.slug,
        metaTitle: postForm.metaTitle,
        metaDescription: postForm.metaDescription,
      };

      const isEditing = Boolean(postForm.id);
      const url = isEditing ? `/api/posts/${postForm.id}` : '/api/posts';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');

      const saved = await res.json();
      const normalized = normalizePost(saved);

      setPosts((curr) => {
        if (!isEditing) return [normalized, ...curr];
        return curr.map((post) => (post.id === normalized.id ? normalized : post));
      });

      setStats((curr) => ({
        ...curr,
        totalPosts: isEditing ? curr.totalPosts : curr.totalPosts + 1,
      }));

      toast.success(isEditing ? 'Post updated' : 'Post created');
      setShowPostForm(false);
      setEditingPost(null);
      setPostForm(EMPTY_POST_FORM);
      setSlugTouched(false);
    } catch (error) {
      console.error('[Admin handleSavePost]', error);
      toast.error('Could not save post');
    } finally {
      setSavingPost(false);
    }
  };

  const onSidebarClick = (item: { key: MenuKey; tab?: TabKey }) => {
    setActiveMenu(item.key);
    setSidebarOpen(false);

    if (item.tab) {
      setActiveTab(item.tab);
      return;
    }

    toast('This section will be added in a later update.');
  };

  const statsCards = [
    {
      label: 'Total Posts',
      value: stats.totalPosts,
      icon: FileText,
    },
    {
      label: 'Total Comments',
      value: stats.totalComments,
      icon: MessageSquare,
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
    },
    {
      label: 'Total Views',
      value: stats.totalViews,
      icon: BarChart3,
    },
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-3 text-[var(--text-muted)] dark:bg-slate-900">
          <Loader className="h-4 w-4 animate-spin" />
          <span>Loading admin dashboard...</span>
        </div>
      </div>
    );
  }

  if (!session?.user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] dark:bg-slate-950">
      <div className="lg:hidden border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <p className="font-semibold">Philosophia Admin</p>
          </div>
          <Button variant="ghost" onClick={() => setSidebarOpen((curr) => !curr)} aria-label="Toggle sidebar">
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside
          className={`border-r border-[var(--border)] bg-[var(--bg-secondary)] p-4 dark:bg-slate-900 ${
            sidebarOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="mb-8 hidden items-center gap-2 lg:flex">
            <ShieldCheck className="h-5 w-5 text-[var(--accent)]" />
            <p className="text-lg font-semibold">Philosophia Admin</p>
          </div>

          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeMenu === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSidebarClick(item)}
                  className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="p-4 md:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-[var(--text-muted)]">Manage posts and comments from one place.</p>
            </div>

            <div className="flex items-center gap-2">
              {TABS.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'outline'}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setActiveMenu(tab.key);
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {statsCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.label}
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-5 shadow-sm transition-transform hover:-translate-y-0.5 dark:bg-slate-900"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
                      <Icon className="h-4 w-4 text-[var(--text-faint)]" />
                    </div>
                    <p className="text-4xl font-semibold leading-none">{card.value}</p>
                  </article>
                );
              })}
            </section>
          )}

          {activeTab === 'posts' && (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button onClick={openCreateForm}>
                  <Plus className="h-4 w-4" />
                  Create Post
                </Button>

                <div className="relative w-full sm:max-w-sm">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-faint)]" />
                  <Input
                    value={postSearchTerm}
                    onChange={(e) => {
                      setPostSearchTerm(e.target.value);
                      setCurrentPostPage(1);
                    }}
                    className="pl-9"
                    placeholder="Search posts by title"
                  />
                </div>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center text-[var(--text-muted)]">
                  No posts found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] dark:bg-slate-900">
                  <table className="min-w-[1100px] w-full text-left text-sm">
                    <thead className="border-b border-[var(--border)] text-[var(--text-faint)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Title</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Category</th>
                        <th className="px-4 py-3 font-medium">Author</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium">Views</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPosts.map((post) => {
                        const published = post.status === 'Published';
                        return (
                          <tr key={post.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-primary)]/60">
                            <td className="px-4 py-3 font-medium">{post.title}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                    published
                                      ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  {post.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handlePublishToggle(post.id, published ? 'Draft' : 'Published')}
                                  className={`relative h-6 w-11 rounded-full transition-colors ${
                                    published ? 'bg-green-500' : 'bg-gray-400'
                                  }`}
                                  aria-label="Toggle publish status"
                                >
                                  <span
                                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                      published ? 'translate-x-5' : 'translate-x-0.5'
                                    }`}
                                  />
                                </button>
                              </div>
                            </td>
                            <td className="px-4 py-3">{post.category}</td>
                            <td className="px-4 py-3">{post.author.name}</td>
                            <td className="px-4 py-3">{formatDate(post.createdAt)}</td>
                            <td className="px-4 py-3">{post.views}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Button variant="outline" className="h-8 px-2" onClick={() => openEditForm(post)}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="h-8 px-2"
                                  onClick={() => openDeleteConfirm('post', post.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredPosts.length > postsPerPage && (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPostPage === 1}
                    onClick={() => setCurrentPostPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-[var(--text-muted)]">
                    Page {currentPostPage} of {postPageCount}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPostPage === postPageCount}
                    onClick={() => setCurrentPostPage((p) => Math.min(postPageCount, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'comments' && (
            <section className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <select
                    value={commentStatusFilter}
                    onChange={(e) => setCommentStatusFilter(e.target.value as 'All' | CommentStatus)}
                    className="h-10 rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]"
                  >
                    <option value="All">All Comments</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Spam">Spam</option>
                  </select>

                  <div className="relative w-full sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--text-faint)]" />
                    <Input
                      value={commentSearchTerm}
                      onChange={(e) => setCommentSearchTerm(e.target.value)}
                      className="pl-9"
                      placeholder="Search comments"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={!selectedCommentIds.length} onClick={handleBulkApprove}>
                    Approve Selected
                  </Button>
                  <Button variant="destructive" disabled={!selectedCommentIds.length} onClick={handleBulkDelete}>
                    Delete Selected
                  </Button>
                </div>
              </div>

              {filteredComments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-10 text-center text-[var(--text-muted)]">
                  No comments found.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] dark:bg-slate-900">
                  <table className="min-w-[1000px] w-full text-left text-sm">
                    <thead className="border-b border-[var(--border)] text-[var(--text-faint)]">
                      <tr>
                        <th className="px-4 py-3 font-medium">
                          <input
                            type="checkbox"
                            checked={filteredComments.length > 0 && selectedCommentIds.length === filteredComments.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCommentIds(filteredComments.map((comment) => comment.id));
                                return;
                              }
                              setSelectedCommentIds([]);
                            }}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium">Comment</th>
                        <th className="px-4 py-3 font-medium">Author</th>
                        <th className="px-4 py-3 font-medium">Post</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Created</th>
                        <th className="px-4 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComments.map((comment) => (
                        <tr key={comment.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-primary)]/60">
                          <td className="px-4 py-3 align-top">
                            <input
                              type="checkbox"
                              checked={selectedCommentIds.includes(comment.id)}
                              onChange={(e) => {
                                setSelectedCommentIds((curr) => {
                                  if (e.target.checked) return [...curr, comment.id];
                                  return curr.filter((id) => id !== comment.id);
                                });
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <p className="max-w-[350px] text-[var(--text-muted)]">{truncate(comment.text, 100)}</p>
                          </td>
                          <td className="px-4 py-3 align-top">{comment.author.name}</td>
                          <td className="px-4 py-3 align-top">
                            {comment.post.slug ? (
                              <Link href={`/blog/${comment.post.slug}`} target="_blank" className="text-[var(--accent)] hover:underline">
                                {truncate(comment.post.title, 60)}
                              </Link>
                            ) : (
                              <span>{truncate(comment.post.title, 60)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                comment.status === 'Approved'
                                  ? 'bg-green-500/15 text-green-700 dark:text-green-300'
                                  : comment.status === 'Pending'
                                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {comment.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-top">{formatDate(comment.createdAt)}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" className="h-8 px-2" onClick={() => handleApproveComment(comment.id)}>
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button variant="outline" className="h-8 px-2" onClick={() => handleCommentStatus(comment.id, 'Spam')}>
                                Reject
                              </Button>
                              <Button
                                variant="destructive"
                                className="h-8 px-2"
                                onClick={() => openDeleteConfirm('comment', comment.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <Dialog open={showPostForm} onOpenChange={setShowPostForm}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Create Post'}</DialogTitle>
            <DialogDescription>
              Fill in the fields below and save your draft or publish immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[var(--text-muted)]">Title</label>
              <Input
                value={postForm.title}
                onChange={(e) => handlePostFormChange('title', e.target.value)}
                placeholder="Post title"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[var(--text-muted)]">Slug</label>
              <Input
                value={postForm.slug}
                onChange={(e) => handlePostFormChange('slug', toSlug(e.target.value))}
                placeholder="post-slug"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--text-muted)]">Category</label>
              <select
                value={postForm.categoryId}
                onChange={(e) => handlePostFormChange('categoryId', e.target.value)}
                className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--text-muted)]">Featured image</label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFeaturedImage(file);
                  }}
                  className="cursor-pointer"
                />
                <Button variant="outline" disabled={uploadingImage}>
                  {uploadingImage ? <Loader className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {postForm.image && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-[var(--text-muted)]">Image preview</label>
                <div className="overflow-hidden rounded-md border border-[var(--border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={postForm.image} alt="Preview" className="h-48 w-full object-cover" />
                </div>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[var(--text-muted)]">Excerpt (100-200 chars)</label>
              <Textarea
                rows={3}
                value={postForm.excerpt}
                onChange={(e) => handlePostFormChange('excerpt', e.target.value)}
                placeholder="Short summary for cards and SEO"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[var(--text-muted)]">Content editor</label>
              <div className="flex flex-wrap items-center gap-2 rounded-t-md border border-[var(--border)] border-b-0 bg-[var(--bg-secondary)] p-2">
                <Button variant="ghost" className="h-8 px-2" onClick={() => applyWrap('<strong>', '</strong>')}>B</Button>
                <Button variant="ghost" className="h-8 px-2 italic" onClick={() => applyWrap('<em>', '</em>')}>I</Button>
                <Button variant="ghost" className="h-8 px-2 underline" onClick={() => applyWrap('<u>', '</u>')}>U</Button>
                <Button variant="ghost" className="h-8 px-2" onClick={() => applyWrap('<h1>', '</h1>')}>H1</Button>
                <Button variant="ghost" className="h-8 px-2" onClick={() => applyWrap('<h2>', '</h2>')}>H2</Button>
                <Button variant="ghost" className="h-8 px-2" onClick={() => applyWrap('<h3>', '</h3>')}>H3</Button>
                <Button variant="ghost" className="h-8 px-2" onClick={() => applyWrap('<ul><li>', '</li></ul>')}>• List</Button>
                <Button variant="ghost" className="h-8 px-2" onClick={() => applyWrap('<ol><li>', '</li></ol>')}>1. List</Button>
                <Button variant="ghost" className="h-8 px-2" onClick={insertLink}>Link</Button>
                <Button variant="ghost" className="h-8 px-2" onClick={() => applyBlock('> ')}>Quote</Button>
              </div>
              <Textarea
                ref={editorRef}
                rows={14}
                value={postForm.content}
                onChange={(e) => handlePostFormChange('content', e.target.value)}
                className="rounded-t-none font-mono text-xs"
                placeholder="Write or paste HTML content"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--text-muted)]">Meta title (SEO)</label>
              <Input
                value={postForm.metaTitle}
                onChange={(e) => handlePostFormChange('metaTitle', e.target.value)}
                placeholder="SEO title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-[var(--text-muted)]">Meta description (SEO)</label>
              <Textarea
                rows={3}
                value={postForm.metaDescription}
                onChange={(e) => handlePostFormChange('metaDescription', e.target.value)}
                placeholder="SEO description"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm text-[var(--text-muted)]">Status</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    checked={postForm.status === 'Draft'}
                    onChange={() => setPostForm((curr) => ({ ...curr, status: 'Draft' }))}
                  />
                  Draft
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="status"
                    checked={postForm.status === 'Published'}
                    onChange={() => setPostForm((curr) => ({ ...curr, status: 'Published' }))}
                  />
                  Published
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostForm(false)} disabled={savingPost}>
              Cancel
            </Button>
            <Button onClick={handleSavePost} disabled={savingPost}>
              {savingPost ? <Loader className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this {deleteTargetType}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
