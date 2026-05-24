import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Learn how Philosophia uses cookies for authentication and sessions, and how analytics tools handle tracking.',
};

const lastUpdated = 'March 2026';

export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <header className="mb-12 sm:mb-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-sans">Legal</p>
        <h1
          className="mt-4 text-4xl sm:text-5xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Cookie Policy
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-3xl">
          This Cookie Policy describes how Philosophia uses cookies and similar technologies on
          blogs.oliprashant.com.np.
        </p>
        <p className="mt-4 text-sm text-[var(--text-faint)] font-sans">Last updated: {lastUpdated}</p>
      </header>

      <div className="space-y-8 sm:space-y-10 text-[var(--text-secondary)] leading-relaxed">
        <section className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-8">
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            1. What Cookies We Use
          </h2>
          <p className="mt-4">
            Philosophia uses cookies only for Firebase authentication state and basic site preferences.
            These cookies help keep you signed in and keep your browsing experience consistent.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            2. Analytics Cookies
          </h2>
          <ul className="mt-4 list-disc pl-5 space-y-2 marker:text-[var(--accent)]">
            <li>
              <strong>Plausible Analytics:</strong> Plausible is configured as a cookie-free analytics
              service.
            </li>
            <li>
              <strong>Google Analytics:</strong> Google Analytics may set cookies to measure traffic,
              sessions, and usage patterns.
            </li>
          </ul>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            3. Your Cookie Choices
          </h2>
          <p className="mt-4">
            You can disable or clear cookies in your browser settings at any time. However, if cookies are
            disabled, sign-in and session-based features may not work as expected.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            4. Contact
          </h2>
          <p className="mt-4">
            For any cookie-related questions, contact us at{' '}
            <a
              href="mailto:oliprashant4321@gmail.com"
              className="text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-light)]"
            >
              oliprashant4321@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}