'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BookOpen, Check, Loader2, LogOut, Mail, PencilLine, MessageSquare, Upload, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: 'READER' | 'AUTHOR' | 'ADMIN';
  firebaseUid: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

type PostItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  savedAt?: string;
  upvotedAt?: string;
};

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  post: { id: string; title: string; slug: string };
};

const tabs = [
  { id: 'saved', label: 'Saved Posts', icon: BookOpen },
  { id: 'upvoted', label: 'Upvoted Posts', icon: Check },
  { id: 'comments', label: 'My Comments', icon: MessageSquare },
] as const;

export default function ProfilePage() {
  const { user: sessionUser, loading: authLoading, logOut } = useAuth();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [savedPosts, setSavedPosts] = useState<PostItem[]>([]);
  const [upvotedPosts, setUpvotedPosts] = useState<PostItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('saved');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [profileRes, savedRes, upvotedRes, commentsRes] = await Promise.all([
          fetch('/api/user/profile', { cache: 'no-store' }),
          fetch('/api/user/saved-posts', { cache: 'no-store' }),
          fetch('/api/user/upvoted-posts', { cache: 'no-store' }),
          fetch('/api/user/comments', { cache: 'no-store' }),
        ]);

        if (!profileRes.ok) {
          if (!cancelled) setProfile(null);
          return;
        }

        const profilePayload = (await profileRes.json()) as { user: ProfileUser };
        const savedPayload = savedRes.ok ? ((await savedRes.json()) as { savedPosts: PostItem[] }) : { savedPosts: [] };
        const upvotedPayload = upvotedRes.ok ? ((await upvotedRes.json()) as { upvotedPosts: PostItem[] }) : { upvotedPosts: [] };
        const commentsPayload = commentsRes.ok ? ((await commentsRes.json()) as { comments: CommentItem[] }) : { comments: [] };

        if (cancelled) return;

        setProfile(profilePayload.user);
        setName(profilePayload.user.name || '');
        setBio(profilePayload.user.bio || '');
        setImage(profilePayload.user.image || '');
        setSavedPosts(savedPayload.savedPosts || []);
        setUpvotedPosts(upvotedPayload.upvotedPosts || []);
        setComments(commentsPayload.comments || []);
      } catch (error) {
        console.error('Profile load failed:', error);
        if (!cancelled) setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, image: image || null }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not update profile');
      }

      setProfile(data.user);
      toast.success('Profile updated');
    } catch (error: any) {
      toast.error(error.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not upload image');
      }

      setImage(data.url);
      toast.success('Avatar uploaded');
    } catch (error: any) {
      toast.error(error.message || 'Could not upload image');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!sessionUser || !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 space-y-4">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
          <div className="flex items-center gap-3 text-[var(--text-primary)]">
            <User className="h-5 w-5" />
            <h1 className="text-2xl font-semibold">Profile</h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">Sign in to view your database profile.</p>
          <Link
            href="/auth/signin"
            className="inline-flex rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const visiblePosts: PostItem[] = activeTab === 'saved' ? savedPosts : upvotedPosts;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <div className="border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            {image || profile.image ? (
              <Image
                src={image || profile.image || ''}
                alt={profile.name || profile.email}
                width={72}
                height={72}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-primary)] text-xl font-semibold text-[var(--text-primary)]">
                {(name || profile.name || profile.email || 'U').slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
                {profile.name || 'Member'}
              </h1>
              <p className="text-sm text-[var(--text-muted)]">Database-backed profile</p>
              <p className="mt-1 text-xs text-[var(--text-faint)]">Signed in as {profile.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              await logOut();
              window.location.href = '/auth/signin';
            }}
            className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4">
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-faint)]">
              <User size={14} /> Name
            </div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Your name"
            />
          </div>

          <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4">
            <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-faint)]">
              <Mail size={14} /> Email
            </div>
            <div className="text-sm text-[var(--text-primary)]">{profile.email}</div>
          </div>
        </div>

        <div className="mt-4 rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-faint)]">
            <PencilLine size={14} /> Bio
          </div>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            className="w-full resize-none bg-transparent text-sm outline-none"
            placeholder="Tell readers a little about yourself"
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]">
            <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload avatar'}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
          <input
            value={image}
            onChange={e => setImage(e.target.value)}
            className="min-w-0 flex-1 rounded-sm border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2.5 text-sm outline-none"
            placeholder="Avatar URL"
          />
          <button
            type="button"
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)] disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save changes
          </button>
        </div>
      </div>

      <div className="border border-[var(--border)] bg-[var(--bg-secondary)] p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)]'
                    : 'border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-3">
          {activeTab === 'comments' ? (
            comments.length ? (
              comments.map(comment => (
                <div key={comment.id} className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4">
                  <p className="text-sm text-[var(--text-primary)]">{comment.content}</p>
                  <div className="mt-2 text-xs text-[var(--text-faint)]">On {comment.post.title}</div>
                </div>
              ))
            ) : (
              <div className="rounded border border-dashed border-[var(--border)] p-6 text-sm text-[var(--text-muted)]">
                You have not written any comments yet.
              </div>
            )
          ) : visiblePosts.length ? (
            visiblePosts.map(item => (
              <Link
                key={item.id}
                href={`/blog/${item.slug}`}
                className="block rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4 transition-colors hover:border-[var(--accent)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {item.coverImage ? (
                    <Image src={item.coverImage} alt={item.title} width={120} height={80} className="h-20 w-32 rounded object-cover" />
                  ) : null}
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.title}</h3>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{item.excerpt || 'No excerpt available.'}</p>
                    <div className="mt-2 text-xs text-[var(--text-faint)]">
                      {item.savedAt ? `Saved ${new Date(item.savedAt).toLocaleDateString()}` : `Upvoted ${new Date(item.upvotedAt || '').toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded border border-dashed border-[var(--border)] p-6 text-sm text-[var(--text-muted)]">
              No items in this section yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
