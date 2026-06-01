import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ADMIN_COOKIE_NAME, createAdminToken, getAdminCookieOptions } from '@/lib/admin-auth';

const schema = z.object({
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 400 });
  }

  const password = process.env.ADMIN_PASSWORD?.trim() || '';
  if (!password || parsed.data.password !== password) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminToken(password), getAdminCookieOptions());
  return response;
}
