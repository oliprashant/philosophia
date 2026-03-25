import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read how Philosophia collects, uses, and protects your data across authentication, analytics, newsletter, and community features.',
};

const lastUpdated = 'March 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <header className="mb-12 sm:mb-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-sans">Legal</p>
        <h1
          className="mt-4 text-4xl sm:text-5xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Privacy Policy
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-3xl">
          This Privacy Policy explains what information Philosophia collects, how it is used, and your
          choices regarding your personal data.
        </p>
        <p className="mt-4 text-sm text-[var(--text-faint)] font-sans">Last updated: {lastUpdated}</p>
      </header>

      <div className="space-y-8 sm:space-y-10 text-[var(--text-secondary)] leading-relaxed">
        <section className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-8">
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            1. Who We Are
          </h2>
          <p className="mt-4">
            Philosophia is an online philosophy publication available at blogs.oliprashant.com.np. The site is
            operated and hosted on Vercel, with application data stored in PostgreSQL on Neon.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            2. Information We Collect
          </h2>
          <div className="mt-4 space-y-4">
            <p>
              We collect information you provide directly and data generated as you use the platform:
            </p>
            <ul className="list-disc pl-5 space-y-2 marker:text-[var(--accent)]">
              <li>
                <strong>Account information:</strong> name and email address when you sign in with Google,
                GitHub, or Facebook OAuth, or when you register using email and password.
              </li>
              <li>
                <strong>User activity data:</strong> highlights, comments, and upvotes you create while using
                the site.
              </li>
              <li>
                <strong>Newsletter data:</strong> email address submitted when subscribing to our newsletter.
              </li>
              <li>
                <strong>Usage analytics:</strong> event and traffic information collected through Google
                Analytics and Plausible Analytics.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            3. How We Use Information
          </h2>
          <ul className="mt-4 list-disc pl-5 space-y-2 marker:text-[var(--accent)]">
            <li>To create and manage user accounts and authenticate logins.</li>
            <li>To provide core community features such as comments, highlights, and upvotes.</li>
            <li>To send newsletter updates to subscribers.</li>
            <li>To analyze traffic, improve performance, and understand readership trends.</li>
            <li>To maintain platform security, integrity, and abuse prevention.</li>
          </ul>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            4. Analytics and Tracking
          </h2>
          <p className="mt-4">
            Philosophia uses both Google Analytics and Plausible Analytics to understand aggregate usage,
            traffic sources, and page performance. These tools may process technical data such as page views,
            referrers, browser metadata, and interaction events.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            5. Data Storage and Hosting
          </h2>
          <p className="mt-4">
            Application infrastructure is hosted on Vercel, and persistent content and engagement data are
            stored in a PostgreSQL database hosted on Neon.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            6. Data Sharing
          </h2>
          <p className="mt-4">
            We do not sell your personal information. Data may be shared with trusted service providers used to
            operate the platform, including authentication providers, analytics providers, hosting providers, and
            infrastructure providers, only as needed to deliver site functionality.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            7. Your Choices
          </h2>
          <ul className="mt-4 list-disc pl-5 space-y-2 marker:text-[var(--accent)]">
            <li>You can choose whether to create an account and which login method to use.</li>
            <li>You can unsubscribe from newsletters at any time.</li>
            <li>You may request account or data-related support by contacting us.</li>
          </ul>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            8. Contact
          </h2>
          <p className="mt-4">
            For privacy questions, requests, or concerns, please contact:{' '}
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