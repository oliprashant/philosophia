import { DefaultSession } from 'next-auth';
import { AdapterUser } from '@auth/core/adapters';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    role?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    role?: string;
  }
}