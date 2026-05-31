'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Facebook, Instagram, Loader2, Mail, Pin, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  facebook: string | null;
  instagram: string | null;
  pinterest: string | null;
};

type SocialKey = 'facebook' | 'instagram' | 'pinterest';

const socialFields: Array<{
  key: SocialKey;
  label: string;
  placeholder: string;
  icon: typeof Facebook;
}> = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/your-profile', icon: Facebook },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your-profile', icon: Instagram },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/your-profile', icon: Pin },
];

export default function ProfileEditPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [image, setImage] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [pinterest, setPinterest] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch('/api/user/profile', { cache: 'no-store' });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as { user: ProfileUser };
        if (cancelled) return;

        setProfile(payload.user);
        setName(payload.user.name || '');
        setBio(payload.user.bio || '');
        setImage(payload.user.image || '');
        setFacebook(payload.user.facebook || '');
        setInstagram(payload.user.instagram || '');
        setPinterest(payload.user.pinterest || '');
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
        body: JSON.stringify({
          name: name.trim() || null,
          bio: bio.trim() || null,
          image: image.trim() || null,
          facebook: facebook.trim() || null,
          instagram: instagram.trim() || null,
          pinterest: pinterest.trim() || null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not update profile');
      }

      toast.success('Profile updated');
      router.push('/profile');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'Could not update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-16">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Profile not available</h1>
          <p className="text-sm text-[var(--text-muted)]">Sign in again to edit your profile.</p>
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--text-faint)]">Account</p>
          <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Edit Profile
          </h1>
        </div>

        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
        >
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="grid gap-8 rounded border border-[var(--border)] bg-[var(--bg-secondary)] p-6 shadow-sm lg:grid-cols-[220px_1fr]">
        <div className="space-y-4">
          {image ? (
            <Image
              src={image}
              alt={profile.name || profile.email}
              width={180}
              height={180}
              className="h-40 w-40 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-40 w-40 items-center justify-center rounded-full bg-[var(--bg-primary)] text-4xl font-semibold text-[var(--text-primary)]">
              {(name || profile.name || profile.email || 'U').slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--text-faint)]">
              <Mail size={14} /> Email
            </div>
            <p className="mt-2 text-[var(--text-primary)]">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-[var(--text-faint)]">Name</label>
              <input
                value={name}
                onChange={event => setName(event.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-[var(--text-faint)]">Avatar URL</label>
              <input
                value={image}
                onChange={event => setImage(event.target.value)}
                className="w-full rounded border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-widest text-[var(--text-faint)]">Bio</label>
            <textarea
              value={bio}
              onChange={event => setBio(event.target.value)}
              rows={5}
              className="w-full resize-none rounded border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
              placeholder="Tell readers a little about yourself"
            />
          </div>

          <div className="space-y-4 rounded border border-[var(--border)] bg-[var(--bg-primary)] p-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Social links</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Add only the links you want to show on your public profile.</p>
            </div>

            {socialFields.map(({ key, label, placeholder, icon: Icon }) => {
              const value = key === 'facebook' ? facebook : key === 'instagram' ? instagram : pinterest;
              const setter = key === 'facebook' ? setFacebook : key === 'instagram' ? setInstagram : setPinterest;

              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-[var(--text-faint)]">
                      <Icon size={14} /> {label}
                    </label>
                    <button
                      type="button"
                      onClick={() => setter('')}
                      className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      <X size={12} /> Remove
                    </button>
                  </div>
                  <input
                    value={value}
                    onChange={event => setter(event.target.value)}
                    className="w-full rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                    placeholder={placeholder}
                  />
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-sm bg-[var(--text-primary)] px-4 py-2.5 text-sm font-medium text-[var(--bg-primary)] transition-colors hover:bg-[var(--accent)] disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save changes
            </button>

            <Link
              href="/profile"
              className="inline-flex items-center gap-2 rounded-sm border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}