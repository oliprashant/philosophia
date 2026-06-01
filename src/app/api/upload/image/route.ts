import { NextRequest, NextResponse } from 'next/server';
import { hasAdminAccess } from '@/lib/admin-auth';
import { uploadImage } from '@/lib/cloudinary';

function resolvePreset(type: string | null) {
  if (type === 'avatar') return { folder: 'avatars' as const, preset: 'avatar' as const };
  if (type === 'cover') return { folder: 'covers' as const, preset: 'cover' as const };
  return { folder: 'inline' as const, preset: 'inline' as const };
}

export async function POST(req: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, WebP or GIF.' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10 MB.' }, { status: 400 });
    }

    const { folder, preset } = resolvePreset(type);
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadImage(buffer, folder, preset);

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error: any) {
    console.error('[Upload Image]', error);
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 });
  }
}
