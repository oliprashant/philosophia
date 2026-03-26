// src/app/api/upload/sign/route.ts
// POST /api/upload/sign → generates a signed Cloudinary upload signature for direct browser uploads.
// Returns signature, timestamp, and Cloudinary credentials. Admin/Author only.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUploadSignature } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const folder = body.folder as string | undefined; // 'covers' | 'inline' | 'avatars'
    const type = body.type as string | undefined; // not used for signature, but can validate

    if (!folder || !['covers', 'avatars', 'inline'].includes(folder)) {
      return NextResponse.json(
        { error: 'Invalid folder. Must be one of: covers, avatars, inline' },
        { status: 400 }
      );
    }

    const role = (session.user as any).role as string;
    if (folder !== 'avatars' && !['ADMIN', 'AUTHOR'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Map folder to preset name
    const presetMap: Record<string, 'cover' | 'avatar' | 'inline'> = {
      covers: 'cover',
      avatars: 'avatar',
      inline: 'inline',
    };

    const preset = presetMap[folder] as 'cover' | 'avatar' | 'inline';
    const signatureData = getUploadSignature(folder as 'covers' | 'avatars' | 'inline', preset);

    return NextResponse.json(signatureData);
  } catch (err: any) {
    console.error('[Upload Sign]', err);
    return NextResponse.json({ error: 'Failed to generate signature' }, { status: 500 });
  }
}
