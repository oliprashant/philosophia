'use client';
// src/components/auth/SessionWrapper.tsx
// Client-side SessionProvider wrapper.
// Next Auth v5 requires the SessionProvider for useSession() hooks.

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

export default function SessionWrapper({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
