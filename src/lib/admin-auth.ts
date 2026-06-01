import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE_NAME = 'philosophia_admin';

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD?.trim() || '';
}

export function createAdminToken(password: string) {
  return crypto.createHmac('sha256', password).update('philosophia-admin').digest('hex');
}

export async function hasAdminAccess() {
  const password = getAdminPassword();
  if (!password) return false;

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(createAdminToken(password)));
}

export function getAdminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}
