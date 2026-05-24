// src/lib/auth.ts
// NextAuth v5 (beta) configuration
// Docs: https://authjs.dev/getting-started/migrating-to-v5

import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import type { NextAuthConfig } from 'next-auth';
import { exchangeFirebaseIdToken } from './firebase-auth';

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  // Custom sign-in page
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt', // required for credentials provider
  },

  providers: (() => {
    const list: any[] = [];

    // Register Google only when credentials are provided
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      list.push(
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: { params: { prompt: 'consent', access_type: 'offline', response_type: 'code' } },
        })
      );
    }

    // Register GitHub only when credentials are provided
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
      list.push(
        GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        })
      );
    }

    // Always include Credentials provider
    list.push(
      CredentialsProvider({
        id: 'firebase',
        name: 'Firebase ID Token',
        credentials: {
          idToken: { label: 'Firebase ID Token', type: 'text' },
        },
        async authorize(credentials) {
          const idToken = credentials?.idToken?.toString();

          if (!idToken) return null;

          try {
            const exchangeResult = await exchangeFirebaseIdToken(idToken);

            if ('status' in exchangeResult) {
              throw new Error(exchangeResult.message);
            }

            return exchangeResult.user;
          } catch (error) {
            throw new Error((error as { message?: string })?.message || 'Unable to verify the Firebase ID token.');
          }
        },
      })
    );

    return list;
  })(),

  callbacks: {
    // Attach role + id to the JWT token
    async jwt({ token, user }) {
  if (user) {
    token.id = user.id;
    token.role = (user as any).role;
  }
  // Always re-fetch role from DB to get latest value
  if (token.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: { role: true },
    });
    token.role = dbUser?.role ?? 'READER';
  }
  return token;
},

    // Expose role + id on the client-side session object
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },

  events: {
    // After first OAuth sign-in, ensure user has a role
    async createUser({ user }) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'READER' },
      });
    },
  },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
