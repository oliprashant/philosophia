import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('philosophia_session')?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({ where: { sessionToken } }).catch(() => undefined);
  }

  clearSessionCookie(response);
  return response;
}