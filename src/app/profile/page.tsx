'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import {
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
  Loader,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PostGrid from '@/components/blog/PostGrid';
import type { PostSummary, Role } from '@/types';

type ProfileUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  bio: string | null;
  role: Role;
  createdAt: string;
};

type CommentItem = {
  id: string;
  text: string;
  createdAt: string;
  post: { title: string; slug: string };
};

type TabKey = 'saved' | 'upvoted' | 'comments' | 'history';

const TABS: Array<{ key: TabKey; label: string; icon: ReactNode }> = [
  { key: 'saved', label: 'Saved Posts', icon: <Bookmark size={14} /> },
  { key: 'upvoted', label: 'Upvoted Posts', icon: <ThumbsUp size={14} /> },
  { key: 'comments', label: 'Comments', icon: <MessageSquare size={14} /> },
  { key: 'history', label: 'Reading History', icon: <History size={14} /> },
];

function getInitials(name?: string | null, email?: string | null) {
  const fallback = (name || email || 'Reader').trim();
  const words = fallback.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'RE';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const tabParam = searchParams.get('tab');
  const initialTab: TabKey =
    tabParam === 'saved' || tabParam === 'upvoted' || tabParam === 'comments' || tabParam === 'history'
      ? tabParam
      : 'saved';

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [tabsLoading, setTabsLoading] = useState(true);
  const [savedPosts, setSavedPosts] = useState<PostSummary[]>([]);
  const [upvotedPosts, setUpvotedPosts] = useState<PostSummary[]>([]);
  const [historyPosts, setHistoryPosts] = useState<PostSummary[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);

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
      try {
        setProfileLoading(true);
        setProfileError(null);
        const res = await fetch('/api/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        if (!mounted) return;
        setProfile(data.user);
        setEditName(data.user.name ?? '');
        setEditBio(data.user.bio ?? '');
        setEditImage(data.user.image ?? null);
      } catch (error) {
        console.error('Profile fetch error:', error);
        if (!mounted) return;
        setProfileError('Failed to load profile');
      } finally {
        if (mounted) setProfileLoading(false);
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
    const loadAllTabs = async () => {
      try {
        setTabsLoading(true);
        const [savedRes, upvotedRes, historyRes, commentsRes] = await Promise.all([
          fetch('/api/posts?saved=true'),
          fetch('/api/posts?upvoted=true'),
          fetch('/api/posts?history=true'),
          fetch('/api/comments?userId=me'),
        ]);

        if (!savedRes.ok || !upvotedRes.ok || !historyRes.ok || !commentsRes.ok) {
          throw new Error('Failed to fetch one or more tabs');
        }

        const [savedData, upvotedData, historyData, commentsData] = await Promise.all([
          savedRes.json(),
          upvotedRes.json(),
          historyRes.json(),
          commentsRes.json(),
        ]);

        if (!mounted) return;

        setSavedPosts(savedData.items ?? []);
        setUpvotedPosts(upvotedData.items ?? []);
        setHistoryPosts(historyData.items ?? []);
        setComments(
          (commentsData.comments ?? []).map((c: any) => ({
            id: c.id,
            text: c.text ?? c.content ?? '',
            createdAt: c.createdAt,
            post: { title: c.post?.title ?? 'Untitled', slug: c.post?.slug ?? '' },
          }))
        );
      } catch (error) {
        console.error('Tab fetch error:', error);
        if (!mounted) return;
        toast.error('Failed to load profile tab data');
      } finally {
        if (mounted) setTabsLoading(false);
      }
    };

    void loadAllTabs();
    return () => {
      mounted = false;
    };
  }, [status]);

  const handleAvatarUpload = async (file?: File | null) => {
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Avatar upload failed');
      }

      const data = await res.json();
      setEditImage(data.url);
      toast.success('Avatar uploaded');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error?.message || 'Avatar upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);

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
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update profile');
      }

      const data = await res.json();
      setProfile(data.user);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (error: any) {
      console.error('Save profile error:', error);
      toast.error(error?.message || 'Failed to update profile');
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

  if (status === 'loading' || profileLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[var(--text-faint)] font-sans">
          <Loader size={18} className="animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        <p className="text-sm font-sans text-red-600">Failed to load profile</p>
      </div>
    );
  }

  if (!session?.user || !profile) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
      <h1 className="text-4xl font-bold mb-8" style={{ fontFamily: 'var(--font-cormorant)' }}>
        My Profile
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-5 lg:sticky top-24 shadow-sm">
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
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[var(--accent)] to-sky-600 text-white flex items-center justify-center text-xl font-sans">
                  {getInitials(profile.name, profile.email)}
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
                  {uploadingAvatar ? <Loader size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploadingAvatar ? 'Uploading...' : 'Upload Profile Picture'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => void handleAvatarUpload(e.target.files?.[0])}
                    disabled={uploadingAvatar}
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-sans bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)] disabled:opacity-60 transition-colors"
                  >
                    {savingProfile ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
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

        <section className="lg:col-span-3">
          <div className="border border-[var(--border)] bg-[var(--bg-primary)] shadow-sm">
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
              {tabsLoading ? (
                <div className="py-12 flex items-center justify-center gap-3 text-[var(--text-faint)] font-sans">
                  <Loader size={18} className="animate-spin" />
                  Loading...
                </div>
              ) : (
                <>
                  {activeTab === 'saved' &&
                    (savedPosts.length ? (
                      <PostGrid posts={savedPosts} />
                    ) : (
                      <p className="text-sm font-sans text-[var(--text-faint)] py-10 text-center">You have no saved posts yet.</p>
                    ))}

                  {activeTab === 'upvoted' &&
                    (upvotedPosts.length ? (
                      <PostGrid posts={upvotedPosts} />
                    ) : (
                      <p className="text-sm font-sans text-[var(--text-faint)] py-10 text-center">
                        You have not upvoted any posts yet.
                      </p>
                    ))}

                  {activeTab === 'history' &&
                    (historyPosts.length ? (
                      <PostGrid posts={historyPosts} />
                    ) : (
                      <p className="text-sm font-sans text-[var(--text-faint)] py-10 text-center">Your reading history is empty.</p>
                    ))}

                  {activeTab === 'comments' &&
                    (comments.length ? (
                      <div className="space-y-3">
                        {comments.map(comment => (
                          <article key={comment.id} className="border border-[var(--border)] p-4 bg-[var(--bg-secondary)]">
                            <Link
                              href={`/blog/${comment.post.slug}`}
                              className="text-sm font-medium text-[var(--accent)] hover:underline"
                              style={{ fontFamily: 'var(--font-cormorant)' }}
                            >
                              {comment.post.title}
                            </Link>
                            <p className="text-sm font-sans text-[var(--text-primary)] mt-2 leading-relaxed">{comment.text}</p>
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
                    ))}
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
