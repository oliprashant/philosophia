import slugify from 'slugify';
import { prisma } from '@/lib/prisma';

export const POST_INCLUDE = {
  author: { select: { id: true, name: true, image: true, bio: true, role: true } },
  category: true,
  humour: true,
  tags: { include: { tag: true } },
  _count: { select: { upvotes: true, comments: true } },
} as const;

export type AdminPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export function serializePost(post: any) {
  return {
    ...post,
    tags: (post.tags || []).map((postTag: any) => postTag.tag),
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export function normalizeStatus(status?: string | null, published?: boolean | null): AdminPostStatus {
  if (status === 'DRAFT' || status === 'PUBLISHED' || status === 'ARCHIVED') return status;
  return published ? 'PUBLISHED' : 'DRAFT';
}

export async function ensureUniqueSlug(baseInput: string, excludeId?: string) {
  const base = slugify(baseInput, { lower: true, strict: true }) || 'post';
  let candidate = base;
  let suffix = 1;

  while (
    await prisma.post.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix++}`;
  }

  return candidate;
}

export function nextPublishedAt(currentPublishedAt: Date | null, nextStatus: AdminPostStatus) {
  if (nextStatus === 'PUBLISHED') {
    return currentPublishedAt ?? new Date();
  }

  return currentPublishedAt;
}
