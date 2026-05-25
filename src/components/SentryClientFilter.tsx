"use client";

import { useEffect } from 'react';

// Small runtime guard to prevent noisy Firebase popup cancellation errors from
// surfacing to global error handlers (and Sentry) in the browser.
export default function SentryClientFilter() {
  useEffect(() => {
    function isFirebasePopupCancel(reason: unknown) {
      const r = reason as any;
      const code = r?.code || '';
      const message = (r && (r.message || r.error || r.toString && r.toString())) || '';
      return (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        String(message).includes('auth/popup-closed-by-user') ||
        String(message).includes('auth/cancelled-popup-request')
      );
    }

    const onUnhandledRejection = (ev: PromiseRejectionEvent) => {
      try {
        if (isFirebasePopupCancel(ev.reason)) {
          // prevent default so other handlers (including Sentry) don't treat this as an error
          ev.preventDefault();
          // Optionally log for local debugging
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('[SentryClientFilter] Ignored firebase popup cancel', ev.reason);
          }
        }
      } catch (err) {
        // ignore
      }
    };

    const onError = (event: ErrorEvent) => {
      try {
        const msg = event?.message || '';
        if (String(msg).includes('auth/popup-closed-by-user') || String(msg).includes('auth/cancelled-popup-request')) {
          // stop propagation
          event.preventDefault();
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.debug('[SentryClientFilter] Ignored firebase popup error', msg);
          }
        }
      } catch (err) {}
    };

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    window.addEventListener('error', onError as EventListener);

    return () => {
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
      window.removeEventListener('error', onError as EventListener);
    };
  }, []);

  return null;
}
