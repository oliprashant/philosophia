'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Pencil,
  Save,
  X,
  Upload,
  Bookmark,
  ThumbsUp,
  MessageSquare,
  History,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PostGrid from '@/components/blog/PostGrid';
import type { PostSummary, Role } from '@/types';

  import {
    User,
    Mail,
    Shield,
    Calendar,
    Pencil,
    Save,
    X,
    Upload,
    Bookmark,
    ThumbsUp,
    MessageSquare,
    History,
    Loader2,
    AlertCircle,
  } from 'lucide-react';@@  const [savingProfile, setSavingProfile] = useState(false);
type ProfileUser = {
  id: string;
  name: string | null;
   const [profileError, setProfileError] = useState<string | null>(null);

    const initialTabParam = searchParams.get('tab');@@        if (!mounted) return;
  email: string | null;
  image: string | null;
  bio: string | null;
  role: Role;
  createdAt: string;
};
          setProfileError(err.message || 'Failed to load profile');

type CommentItem = {
            if (!res.ok) throw new Error('Failed to fetch saved posts');
  id: string;
  content: string;
  createdAt: string;
  post: { id: string; title: string; slug: string };
};

type TabKey = 'saved' | 'upvoted' | 'comments' | 'history';
            if (!res.ok) throw new Error('Failed to fetch upvoted posts');

const TABS: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: 'saved', label: 'Saved Posts', icon: <Bookmark size={14} /> },
  { key: 'upvoted', label: 'Upvoted Posts', icon: <ThumbsUp size={14} /> },
  { key: 'comments', label: 'My Comments', icon: <MessageSquare size={14} /> },
  { key: 'history', label: 'Reading History', icon: <History size={14} /> },
];
            if (!res.ok) throw new Error('Failed to fetch history');

function initialsFrom(name?: string | null, email?: string | null) {
  const base = (name || email || 'Reader').trim();
  const parts = base.split(/\s+/).filter(Boolean);
  if (!parts.length) return 'R';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
            if (!res.ok) throw new Error('Failed to fetch comments');
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);

    if (status === 'unauthenticated') {
      return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--text-faint)] font-sans">Please sign in to view your profile.</p>
          </div>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
          <div className="flex gap-3 text-red-600 font-sans">
            <AlertCircle size={18} />
            <p>{profileError}</p>
          </div>
        </div>
      );
    }

    if (!session?.user || !profile) {
      return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
          <div className="text-center">
            <p className="text-[var(--text-faint)] font-sans">Unable to load profile.</p>
          </div>
        </div>
      );
    }@@
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const initialTabParam = searchParams.get('tab');
  const initialTab: TabKey =
    initialTabParam === 'saved' ||
    initialTabParam === 'upvoted' ||
    initialTabParam === 'comments' ||
    initialTabParam === 'history'
      ? initialTabParam
      : 'saved';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [savedPosts, setSavedPosts] = useState<PostSummary[]>([]);
  const [upvotedPosts, setUpvotedPosts] = useState<PostSummary[]>([]);
  const [historyPosts, setHistoryPosts] = useState<PostSummary[]>([]);
  const [myComments, setMyComments] = useState<CommentItem[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin?callbackUrl=/profile');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let mounted = true;
    const loadProfile = async () => {
      setLoadingProfile(true);
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Could not load profile');
        const data = await res.json();
        if (!mounted) return;
        setProfile(data.user);
        setEditName(data.user.name ?? '');
        setEditBio(data.user.bio ?? '');
        setEditImage(data.user.image ?? null);
      } catch (err: any) {
        toast.error(err.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    let mounted = true;
    const loadTab = async () => {
      setLoadingTab(true);
      try {
        if (activeTab === 'saved') {
          const res = await fetch('/api/posts?saved=true');
          const data = await res.json();
          if (!mounted) return;
          setSavedPosts(data.items ?? []);
        }

        if (activeTab === 'upvoted') {
          const res = await fetch('/api/posts?upvoted=true');
          const data = await res.json();
          if (!mounted) return;
          setUpvotedPosts(data.items ?? []);
        }

        if (activeTab === 'history') {
          const res = await fetch('/api/posts?history=true');
          const data = await res.json();
          if (!mounted) return;
          setHistoryPosts(data.items ?? []);
        }

        if (activeTab === 'comments') {
          const res = await fetch('/api/comments?userId=me');
          const data = await res.json();
          if (!mounted) return;
          setMyComments(data.comments ?? []);
        }
      } catch {
        toast.error('Failed to load tab content');
      } finally {
        if (mounted) setLoadingTab(false);
      }
    };

    void loadTab();
    return () => {
      mounted = false;
    };
  }, [activeTab, status]);

  const uploadAvatar = async (file?: File | null) => {
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'avatar');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Avatar upload failed');
      }
      const data = await res.json();
      setEditImage(data.url);
      toast.success('Avatar uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          image: editImage,
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update profile');
      }

      const data = await res.json();
      setProfile(data.user);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const cancelEdit = () => {
    if (!profile) return;
    setEditName(profile.name ?? '');
    setEditBio(profile.bio ?? '');
    setEditImage(profile.image ?? null);
    setIsEditing(false);
  };

  const memberSince = useMemo(() => {
    if (!profile?.createdAt) return '';
    return `Member since ${format(new Date(profile.createdAt), 'MMMM yyyy')}`;
  }, [profile?.createdAt]);

  if (status === 'loading' || loadingProfile) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--text-faint)] font-sans">
          <Loader2 size={18} className="animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!session?.user || !profile) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'var(--font-cormorant)' }}>
        My Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <div className="border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-5 sticky top-24">
            <div className="flex items-center gap-4">
              {((isEditing ? editImage : profile.image) || '').trim() ? (
                <Image
                  src={(isEditing ? editImage : profile.image) as string}
                  alt={profile.name ?? 'Profile image'}
                  width={72}
                  height={72}
                  className="rounded-full border border-[var(--border)] object-cover"
                />
              ) : (
                <div className="w-[72px] h-[72px] rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xl font-sans">
                  {initialsFrom(profile.name, profile.email)}
                </div>
              )}

              <div>
                <p className="text-xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {profile.name || 'Unnamed Reader'}
                </p>
                <p className="text-sm text-[var(--text-faint)] font-sans flex items-center gap-1.5">
                  <Mail size={14} /> {profile.email}
                </p>
              </div>
            </div>

            {!isEditing ? (
              <>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-sans">Role</p>
                  <p className="inline-flex items-center gap-2 px-2.5 py-1 border border-[var(--border)] text-sm font-sans text-[var(--text-primary)]">
                    <Shield size={14} /> {profile.role}
                  </p>
                </div>

                {profile.bio && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-widest text-[var(--text-faint)] font-sans">Bio</p>
                    <p className="text-sm font-sans text-[var(--text-primary)] leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                <p className="text-sm font-sans text-[var(--text-faint)] flex items-center gap-2">
                  <Calendar size={14} /> {memberSince}
                </p>

                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <Pencil size={14} /> Edit Profile
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-[var(--text-faint)] mb-1">Bio</label>
                  <textarea
                    rows={4}
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-sans bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] resize-none"
                  />
                </div>

                <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-colors">
                  {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadingAvatar ? 'Uploading...' : 'Upload Profile Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => void uploadAvatar(e.target.files?.[0])}
                    disabled={uploadingAvatar}
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors"
                  >
                    {savingProfile ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={savingProfile}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-60 transition-colors"
                  >
                    <X size={14} /> Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <section className="lg:col-span-8">
          <div className="border border-[var(--border)] bg-[var(--bg-primary)]">
            <div className="border-b border-[var(--border)] p-2 flex flex-wrap gap-2">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-sans transition-colors ${
                    activeTab === tab.key
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {loadingTab ? (
                <div className="py-12 flex items-center justify-center gap-3 text-[var(--text-faint)] font-sans">
                  <Loader2 size={18} className="animate-spin" />
                  Loading...
                </div>
              ) : (
                <>
                  {activeTab === 'saved' && (
                    savedPosts.length ? (
                      <PostGrid posts={savedPosts} />
                    ) : (
                      <p className="text-sm font-sans text-[var(--text-faint)] py-10 text-center">
                        You have no saved posts yet.
                      </p>
                    )
                  )}

                  {activeTab === 'upvoted' && (
                    upvotedPosts.length ? (
                      <PostGrid posts={upvotedPosts} />
                    ) : (
                      <p className="text-sm font-sans text-[var(--text-faint)] py-10 text-center">
                        You have not upvoted any posts yet.
                      </p>
                    )
                  )}

                  {activeTab === 'history' && (
                    historyPosts.length ? (
                      <PostGrid posts={historyPosts} />
                    ) : (
                      <p className="text-sm font-sans text-[var(--text-faint)] py-10 text-center">
                        Your reading history is empty.
                      </p>
                    )
                  )}

                  {activeTab === 'comments' && (
                    myComments.length ? (
                      <div className="space-y-3">
                        {myComments.map(comment => (
                          <article key={comment.id} className="border border-[var(--border)] p-4 bg-[var(--bg-secondary)]">
                            <Link
                              href={`/blog/${comment.post.slug}`}
                              className="text-sm font-medium text-[var(--accent)] hover:underline"
                              style={{ fontFamily: 'var(--font-cormorant)' }}
                            >
                              {comment.post.title}
                            </Link>
                            <p className="text-sm font-sans text-[var(--text-primary)] mt-2 leading-relaxed">{comment.content}</p>
                            <p className="text-xs text-[var(--text-faint)] font-sans mt-2">
                              {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                            </p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-sans text-[var(--text-faint)] py-10 text-center">
                        You have not posted any comments yet.
                      </p>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
