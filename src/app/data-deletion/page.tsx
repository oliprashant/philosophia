import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Deletion Instructions',
  description:
    'Instructions for deleting your Philosophia account and personal data, including users who signed in with Facebook Login.',
  alternates: {
    canonical: '/data-deletion',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Data Deletion Instructions | Philosophia',
    description:
      'Request deletion of your Philosophia account and related personal data.',
    url: '/data-deletion',
    type: 'website',
  },
};

const SUPPORT_EMAIL = 'prashant@oliprashant.com.np';
const LAST_UPDATED = 'April 26, 2026';

const dataDeletionJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Data Deletion Instructions',
  url: 'https://blogs.oliprashant.com.np/data-deletion',
  description:
    'How users can request deletion of their Philosophia account and personal data.',
  inLanguage: 'en',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Philosophia',
    url: 'https://blogs.oliprashant.com.np',
  },
};

export default function DataDeletionPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dataDeletionJsonLd) }}
      />

      <header className="mb-12 sm:mb-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-sans">Legal</p>
        <h1
          className="mt-4 text-4xl sm:text-5xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          User Data Deletion
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-3xl">
          This page explains how to request deletion of your account and personal data from Philosophia,
          including data associated with Facebook Login.
        </p>
        <p className="mt-4 text-sm text-[var(--text-faint)] font-sans">Last updated: {LAST_UPDATED}</p>
      </header>

      <div className="space-y-8 sm:space-y-10 text-[var(--text-secondary)] leading-relaxed">
        <section className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-8">
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            How To Request Deletion
          </h2>
          <p className="mt-4">
            Email{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-[var(--accent)] underline underline-offset-4 hover:text-[var(--accent-light)]"
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            from your registered email to delete your account.
          </p>
          <p className="mt-3 text-sm text-[var(--text-muted)] font-sans">
            Please include your account email and mention that your request is for account and data deletion.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            What Happens Next
          </h2>
          <ul className="mt-4 list-disc pl-5 space-y-2 marker:text-[var(--accent)]">
            <li>We acknowledge your request within 72 hours.</li>
            <li>We verify ownership by matching the request email with your registered account.</li>
            <li>We complete deletion of account data within 30 days of verification.</li>
          </ul>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Retention Exceptions
          </h2>
          <p className="mt-4">
            Certain records may be retained for a limited period where required for legal, security, or
            fraud-prevention reasons. Retained records are minimized and removed when no longer required.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            Facebook Login Users
          </h2>
          <p className="mt-4">
            If you signed in using Facebook Login and remove the app from Facebook, you can still use the
            email process above to request full account and data deletion from our systems.
          </p>
        </section>
      </div>
    </div>
  );
}