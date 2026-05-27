import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SESSION_COOKIE_NAME = 'philosophia_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: 'READER' | 'AUTHOR' | 'ADMIN';
  firebaseUid: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = { user: SessionUser } | null;

export function serializeUser(user: {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  firebaseUid: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    bio: user.bio,
    role: user.role as SessionUser['role'],
    firebaseUid: user.firebaseUid,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function createSessionForUser(userId: string) {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  return { sessionToken, expires };
}

export function setSessionCookie(response: NextResponse, sessionToken: string, expires: Date) {
  response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
}

export async function auth(): Promise<AuthSession> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expires.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { sessionToken } }).catch(() => undefined);
    return null;
  }

  return { user: serializeUser(session.user) };
}
