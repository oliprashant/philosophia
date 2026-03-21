'use client';
// src/components/layout/Header.tsx
// Responsive header with:
// - Brand logo + tagline
// - Category dropdown navigation
// - Search link
// - Dark mode toggle
// - Auth state (sign in button / user menu)

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Menu, X, Search, Sun, Moon, ChevronDown, User, BookOpen, Settings, LogOut, PenLine } from 'lucide-react';

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
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [genreOpen, setGenreOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false); // 👈 add this
  const catRef = useRef<HTMLDivElement>(null);

  // Detect scroll for shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
        setGenreOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => setMounted(true), []); // 👈 add here

  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const isAuthor = (session?.user as any)?.role === 'AUTHOR' || isAdmin;

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
                onClick={() => { setCatOpen(!catOpen); setGenreOpen(false); }}
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

            {/* Genre dropdown */}
            <div className="relative">
              <button
                onClick={() => { setGenreOpen(!genreOpen); setCatOpen(false); }}
                className="flex items-center gap-1 text-sm font-sans text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-expanded={genreOpen}
              >
                Forms <ChevronDown size={14} className={`transition-transform ${genreOpen ? 'rotate-180' : ''}`} />
              </button>
              {genreOpen && (
                <div className="absolute top-full left-0 mt-2 w-44 bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-card py-1 animate-slide-down">
                  {NAV_GENRES.map(g => (
                    <Link
                      key={g.slug}
                      href={`/blog?genre=${g.slug}`}
                      className="block px-4 py-2 text-sm font-sans text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)] transition-colors"
                      onClick={() => setGenreOpen(false)}
                    >
                      {g.name}
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
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
             {mounted ? (resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} />}            </button>

            {/* Auth */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 focus-ring rounded-full"
                  aria-label="User menu"
                >
                  {session.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name ?? 'User'}
                      width={32}
                      height={32}
                      className="rounded-full border border-[var(--border)]"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-sans font-medium">
                      {session.user?.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-primary)] border border-[var(--border)] rounded-sm shadow-card py-1 animate-slide-down z-50">
                    <div className="px-4 py-2 border-b border-[var(--border)]">
                      <p className="text-sm font-medium truncate">{session.user?.name}</p>
                      <p className="text-xs text-[var(--text-faint)] truncate">{session.user?.email}</p>
                    </div>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm font-sans hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <User size={14} /> Profile
                    </Link>
                    <Link href="/profile/saved" className="flex items-center gap-2 px-4 py-2 text-sm font-sans hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <BookOpen size={14} /> Saved Posts
                    </Link>
                    {isAuthor && (
                      <Link href="/admin/editor" className="flex items-center gap-2 px-4 py-2 text-sm font-sans hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <PenLine size={14} /> Write
                      </Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm font-sans hover:bg-[var(--bg-secondary)] transition-colors" onClick={() => setUserMenuOpen(false)}>
                        <Settings size={14} /> Admin
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm font-sans text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="hidden sm:inline-flex items-center px-4 py-1.5 text-sm font-sans font-medium text-[var(--bg-primary)] bg-[var(--text-primary)] hover:bg-[var(--accent)] transition-colors rounded-sm"
              >
                Sign In
              </Link>
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
            <p className="text-xs font-sans font-medium uppercase tracking-widest text-[var(--text-faint)] px-2 py-1">Forms</p>
            {NAV_GENRES.map(g => (
              <Link key={g.slug} href={`/blog?genre=${g.slug}`} className="block px-2 py-2 text-sm font-sans text-[var(--text-secondary)] hover:text-[var(--accent)]" onClick={() => setMobileOpen(false)}>
                {g.name}
              </Link>
            ))}
            <div className="h-px bg-[var(--border)] my-2" />
            <Link href="/about" className="block px-2 py-2 text-sm font-sans" onClick={() => setMobileOpen(false)}>About</Link>
            {!session && (
              <Link href="/auth/signin" className="block px-2 py-2 text-sm font-sans font-medium text-[var(--accent)]" onClick={() => setMobileOpen(false)}>Sign In</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
