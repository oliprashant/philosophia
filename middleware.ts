import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, createAdminToken } from './src/lib/admin-auth';

function isProtectedPath(pathname: string) {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin') || pathname === '/api/upload/image';
}

function isPublicAdminPath(pathname: string) {
  return pathname === '/admin/login' || pathname === '/api/admin/login' || pathname === '/api/admin/logout';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname) || isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const password = process.env.ADMIN_PASSWORD?.trim() || '';
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const expectedToken = password ? createAdminToken(password) : '';
  const hasAccess = Boolean(password && token && token === expectedToken);

  if (hasAccess) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/api/upload/image'],
};
