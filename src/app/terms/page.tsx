import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'Read the terms governing acceptable use, user accounts, comments, ownership, and liability on Philosophia.',
};

const lastUpdated = 'March 2026';

export default function TermsOfUsePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
      <header className="mb-12 sm:mb-14">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)] font-sans">Legal</p>
        <h1
          className="mt-4 text-4xl sm:text-5xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-cormorant)' }}
        >
          Terms of Use
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[var(--text-muted)] leading-relaxed max-w-3xl">
          These Terms of Use govern access to and use of Philosophia at blogs.oliprashant.com.np.
          By using the site, you agree to these terms.
        </p>
        <p className="mt-4 text-sm text-[var(--text-faint)] font-sans">Last updated: {lastUpdated}</p>
      </header>

      <div className="space-y-8 sm:space-y-10 text-[var(--text-secondary)] leading-relaxed">
        <section className="rounded-sm border border-[var(--border)] bg-[var(--bg-secondary)] p-6 sm:p-8">
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            1. Acceptable Use
          </h2>
          <p className="mt-4">
            You agree to use Philosophia lawfully and respectfully. You must not misuse the platform,
            attempt unauthorized access, disrupt services, or use the site to distribute harmful or illegal
            material.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            2. User Accounts
          </h2>
          <p className="mt-4">
            You are responsible for activity under your account and for maintaining account security.
            Accounts may be suspended or removed for violations of these terms or abuse of the platform.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            3. Content Ownership
          </h2>
          <p className="mt-4">
            Unless otherwise stated, all essays and published editorial content on Philosophia belong to
            Philosophia and are protected by applicable intellectual property laws.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            4. Comments Policy
          </h2>
          <ul className="mt-4 list-disc pl-5 space-y-2 marker:text-[var(--accent)]">
            <li>No hate speech.</li>
            <li>No spam, deceptive promotion, or repetitive posting.</li>
            <li>No harassment, threats, or abusive conduct toward others.</li>
          </ul>
          <p className="mt-4">
            We may moderate, remove, or restrict comments and accounts that violate these standards.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            5. Newsletter Terms
          </h2>
          <p className="mt-4">
            By subscribing to the newsletter, you agree to receive periodic emails from Philosophia.
            You may unsubscribe at any time through the unsubscribe option included in newsletter emails.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            6. Disclaimer of Warranties
          </h2>
          <p className="mt-4">
            Philosophia is provided on an "as is" and "as available" basis without warranties of any kind,
            express or implied, including availability, accuracy, or fitness for a particular purpose.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            7. Limitation of Liability
          </h2>
          <p className="mt-4">
            To the maximum extent permitted by law, Philosophia and its operators are not liable for any
            indirect, incidental, special, consequential, or punitive damages arising from your use of or
            inability to use the platform.
          </p>
        </section>

        <section>
          <h2
            className="text-2xl sm:text-3xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-cormorant)' }}
          >
            8. Contact
          </h2>
          <p className="mt-4">
            For questions about these Terms of Use, contact{' '}
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