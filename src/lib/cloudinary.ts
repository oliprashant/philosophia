// src/lib/cloudinary.ts
// Cloudinary integration for image upload with automatic resizing.
// Uses signed uploads (server-side) to keep API secrets off the client.

import { v2 as cloudinary } from 'cloudinary';

// ── Configure ─────────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// ── Types ──────────────────────────────────────────────────────────────────────
export interface UploadResult {
  url: string;           // HTTPS Cloudinary URL
  publicId: string;      // Used for deletion / transformation
  width: number;
  height: number;
  format: string;
}

// ── Upload image (from buffer or base64 data URI) ─────────────────────────────
/**
 * Uploads an image to Cloudinary with automatic resizing transformations.
 * Cover images are set to 1200×630 (Open Graph optimal). Avatars are 200×200.
 *
 * @param data    - Buffer, base64 string, or remote URL
 * @param folder  - Cloudinary folder (e.g. "covers", "avatars")
 * @param preset  - 'cover' | 'avatar' – determines resize dimensions
 */
export async function uploadImage(
  data: string | Buffer,
  folder: 'covers' | 'avatars' | 'inline',
  preset: 'cover' | 'avatar' | 'inline' = 'inline'
): Promise<UploadResult> {
  const transformations: Record<string, object> = {
    cover: {
      width: 1200,
      height: 630,
      crop: 'fill',
      gravity: 'auto',     // AI-powered focal point
      quality: 'auto:good',
      fetch_format: 'auto',
    },
    avatar: {
      width: 200,
      height: 200,
      crop: 'fill',
      gravity: 'face',     // Centre on face for avatars
      quality: 'auto:good',
      fetch_format: 'auto',
    },
    inline: {
      width: 900,
      crop: 'limit',       // Never upscale, max 900px wide
      quality: 'auto:good',
      fetch_format: 'auto',
    },
  };

  const result = await cloudinary.uploader.upload(
    typeof data === 'string' ? data : `data:image/jpeg;base64,${data.toString('base64')}`,
    {
      folder: `philosophia/${folder}`,
      transformation: [transformations[preset]],
      overwrite: false,
      invalidate: true,
    }
  );

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

// ── Delete an image ────────────────────────────────────────────────────────────
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// ── Generate a signed upload URL (for direct browser upload) ──────────────────
/**
 * Returns a signed upload URL that the client can use to upload directly
 * to Cloudinary without exposing the API secret.
 * Expires in 60 seconds.
 */
export function generateSignedUploadParams(folder: string): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: `philosophia/${folder}` };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
  };
}

// ── Generate upload signature for direct browser upload ────────────────────────
/**
 * Generates a Cloudinary upload signature for direct browser uploads.
 * Used by /api/upload/sign to allow client-side uploads without exposing secrets.
 *
 * @param folder - Cloudinary folder name (e.g. 'covers', 'avatars', 'inline')
 * @param uploadPreset - Upload preset name
 * @returns Signature payload for Cloudinary direct upload
 */
export function getUploadSignature(
  folder: 'covers' | 'avatars' | 'inline',
  uploadPreset: 'cover' | 'avatar' | 'inline'
): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  uploadPreset: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const folderPath = `philosophia/${folder}`;
  const params = {
    timestamp,
    folder: folderPath,
    upload_preset: uploadPreset,
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder: folderPath,
    uploadPreset,
  };
}

export { cloudinary };
