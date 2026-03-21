import { DefaultSession } from 'next-auth';
import { AdapterUser } from '@auth/core/adapters';

declare module 'next-auth' {
  interface Session {
    user: {
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role?: string;
  }
}