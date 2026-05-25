"use client";
// src/components/layout/Header.tsx

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import {
  BookOpen,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_CATEGORIES = [
  { name: 'Ethics', slug: 'ethics' },
  { name: 'Metaphysics', slug: 'metaphysics' },
  { name: 'Existentialism', slug: 'existentialism' },
  { name: 'Epistemology', slug: 'epistemology' },
  { name: 'Aesthetics', slug: 'aesthetics' },
];

const NAV_GENRES = [
  { name: 'Essays', slug: 'ESSAY' },
  { name: 'Dialogues', slug: 'DIALOGUE' },
  { name: 'Poems', slug: 'POEM' },
  { name: 'Aphorisms', slug: 'APHORISM' },
];

export default function Header() {
  const { user, loading, signInWithGoogle, logOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Detect scroll for shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideNav = catRef.current?.contains(target) ?? false;
      const insideUserMenu = userMenuRef.current?.contains(target) ?? false;

      if (!insideNav && !insideUserMenu) {
        setCatOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border)] transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ── */}
          <Link href="/" className="flex flex-col leading-none group">
            <span
              className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              Philosophia
            </span>
            <span className="text-[10px] font-sans tracking-[0.2em] text-[var(--text-faint)] uppercase mt-0.5">
              A Journal of Ideas
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-6" ref={catRef}>
            {/* Categories dropdown */}
            <div className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                className="flex items-center gap-1 text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-expanded={catOpen}
              >
                Topics <ChevronDown size={14} className={`transition-transform ${catOpen ? 'rotate-180' : ''}`} />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-card py-1 animate-slide-down">
                  {NAV_CATEGORIES.map(cat => (
                    <Link
                      key={cat.slug}
                      href={`/blog?category=${cat.slug}`}
                      className="block px-4 py-2 text-sm font-sans text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)] transition-colors"
                      onClick={() => setCatOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/about"
              className="text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              About
            </Link>
          </nav>

          {/* ── Right controls ── */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <Link
              href="/search"
              aria-label="Search"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              <Search size={18} />
            </Link>

            {/* Theme toggle */}
            {mounted ? (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                {resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            ) : (
              <span
                className="inline-flex h-9 w-9 items-center justify-center"
                aria-hidden="true"
              />
            )}

            {/* Auth */}
            {loading ? null : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 focus-ring rounded-full"
                  aria-label="User menu"
                >
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName ?? 'User'}
                      width={32}
                      height={32}
                      className="rounded-full border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-sans font-medium">
                      {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-card py-1 animate-slide-down z-50">
                    <div className="px-4 py-2 border-b border-[var(--border)]">
                      <p className="text-sm font-medium truncate">{user.displayName || 'Google user'}</p>
                      <p className="text-xs text-[var(--text-faint)] truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-sans hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <User size={14} /> Profile
                    </Link>
                    <Link
                      href="/profile?tab=saved"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-sans hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <BookOpen size={14} /> Saved Posts
                    </Link>
                    <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm font-sans hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Settings size={14} /> Dashboard
                    </Link>
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        try {
                          await logOut();
                        } catch (error) {
                          console.error('Sign out failed:', error);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-sans text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (error) {
                    console.error('Google sign-in failed:', error);
                  }
                }}
                className="hidden sm:inline-flex items-center px-4 py-1.5 text-sm font-sans font-medium text-[var(--bg-primary)] bg-[var(--text-primary)] hover:bg-[var(--accent)] transition-colors rounded-sm"
              >
                Sign in with Google
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-[var(--text-muted)]"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg-secondary)] animate-slide-down">
          <nav className="px-4 py-4 space-y-1">
            <p className="text-xs font-sans font-medium uppercase tracking-widest text-[var(--text-faint)] px-2 py-1">Topics</p>
            {NAV_CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/blog?category=${cat.slug}`} className="block px-2 py-2 text-sm font-sans text-[var(--text-secondary)] hover:text-[var(--accent)]" onClick={() => setMobileOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <div className="h-px bg-[var(--border)] my-2" />
            <Link href="/about" className="block px-2 py-2 text-sm font-sans" onClick={() => setMobileOpen(false)}>About</Link>
            {user && (
              <>
                <Link href="/profile" className="block px-2 py-2 text-sm font-sans" onClick={() => setMobileOpen(false)}>Profile</Link>
                <Link href="/admin" className="block px-2 py-2 text-sm font-sans" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              </>
            )}
            {!user && (
              <button type="button" onClick={() => void signInWithGoogle()} className="block px-2 py-2 text-sm font-sans font-medium text-[var(--accent)] text-left">
                Sign in with Google
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
