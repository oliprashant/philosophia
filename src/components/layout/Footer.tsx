// src/components/layout/Footer.tsx
import Link from 'next/link';

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
    { label: 'Writers', href: '/writers' },
    { label: 'Newsletter', href: '/#newsletter' },
    { label: 'Suggest an Edit', href: '/suggest' },
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
                {[
                  { label: 'Twitter', href: 'https://twitter.com', icon: '𝕏' },
                  { label: 'Facebook', href: 'https://facebook.com', icon: 'f' },
                ].map(s => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-8 h-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-faint)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-sm font-sans"
                  >
                    {s.icon}
                  </a>
                ))}
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
              href="/about"
              className="text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
            >
              About
            </Link>
            <Link
              href="/terms"
              className="text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
            >
              Privacy Policy
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
