import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hasAdminAccess } from '@/lib/admin-auth';

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export async function POST(req: NextRequest) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();
  const { ids, status } = parsed.data;

  const updateData = {
    status,
    published: status === 'PUBLISHED',
    ...(status === 'PUBLISHED' ? { publishedAt: now } : {}),
  };

  const result = await prisma.post.updateMany({
    where: { id: { in: ids } },
    data: updateData,
  });

  return NextResponse.json({ success: true, count: result.count });
}
