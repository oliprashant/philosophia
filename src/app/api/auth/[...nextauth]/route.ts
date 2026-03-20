// src/app/api/auth/[...nextauth]/route.ts
// NextAuth v5 App Router handler.
// Delegates all auth routes (/api/auth/signin, /callback, etc.) to NextAuth.

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
