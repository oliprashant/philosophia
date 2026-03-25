// src/app/layout.tsx
// Root layout – wraps every page with:
// - Theme provider (dark/light)
// - Auth session provider
// - Toast notifications
// - Analytics scripts (Plausible + Google Analytics)
import type { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';
import SessionWrapper from '@/components/auth/SessionWrapper';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AIChatWidget from '@/components/ai/AIChatWidget';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://blogs.oliprashant.com.np'),
  title: { default: 'Philosophia', template: '%s — Philosophia' },
  description: 'A literary journal of philosophical inquiry. Essays, dialogues, and poems exploring the examined life.',
  keywords: ['philosophy', 'ethics', 'existentialism', 'metaphysics', 'essays'],
  authors: [{ name: 'Philosophia Editorial' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXTAUTH_URL,
    siteName: 'Philosophia',
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: 'Philosophia' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const plausibleDomain = process.env.PLAUSIBLE_DATA_DOMAIN;
  const gaId = process.env.GOOGLE_ANALYTICS_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Plausible Analytics – privacy-first, no cookies */}
        {plausibleDomain && (
          <script
            defer
            data-domain={plausibleDomain}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {/* Google Analytics 4 */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <SessionWrapper>
          
              <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              {/* Floating AI chat widget – available on all pages */}
              <AIChatWidget />
              {/* Toast notifications */}
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    fontFamily: 'var(--font-dm-sans)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                  },
                }}
              />
           
          </SessionWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}