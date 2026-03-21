import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  const session = req.auth;

  console.log('Session:', JSON.stringify(session));
  console.log('Role:', session?.user?.role);

  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    if (session.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};