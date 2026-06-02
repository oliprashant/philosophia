// src/components/layout/Footer.tsx
import Link from 'next/link';
import { Facebook, Instagram } from 'lucide-react';

const FOOTER_LINKS = {
  Explore: [
    { label: 'All Posts', href: '/blog' },
    { label: 'Ethics', href: '/blog?category=ethics' },
    { label: 'Existentialism', href: '/blog?category=existentialism' },
    { label: 'Metaphysics', href: '/blog?category=metaphysics' },
    { label: 'Search', href: '/search' },
  ],
  Community: [
    { label: 'About', href: '/about' },
    { label: 'Newsletter', href: '/#newsletter' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] mt-20">
      {/* Decorative rule */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pt-12 pb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand column */}
            <div className="md:col-span-1 space-y-4">
              <h2
                className="text-3xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: 'var(--font-cormorant)' }}
              >
                Philosophia
              </h2>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed font-sans max-w-xs">
                A literary journal dedicated to the examined life. We believe philosophy belongs 
                to everyone who dares to ask.
              </p>
              {/* Social links */}
              <div className="flex gap-4 pt-2">
                <a
                  href="https://www.facebook.com/prashant.oli.416572"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <Facebook size={14} />
                </a>
                <a
                  href="https://www.instagram.com/sisyphuss5/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <Instagram size={14} />
                </a>
                <a
                  href="https://pin.it/6C6jSS9w1"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Pinterest"
                  className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            {Object.entries(FOOTER_LINKS).map(([section, links]) => (
              <div key={section}>
                <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-[var(--text-faint)] mb-4">
                  {section}
                </h3>
                <ul className="space-y-2">
                  {links.map(link => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm font-sans text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[var(--border)] py-6 flex flex-col items-center gap-3">
          <nav aria-label="Footer bottom links" className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/terms"
              className="text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
            >
              Terms of Use
            </Link>
            <Link
              href="/privacy"
              className="text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/cookies"
              className="text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
            >
              Cookie Policy
            </Link>
          </nav>

          <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-sans text-[var(--text-faint)]">
            © {year} Philosophia. All rights reserved.
          </p>
          <p className="text-xs font-sans text-[var(--text-faint)] italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
            "The unexamined life is not worth living." — Socrates
          </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
