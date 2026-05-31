#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

function getEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function buildSupabaseAdminClient() {
  return createClient(getEnv('NEXT_PUBLIC_SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function generatePassword() {
  return crypto.randomBytes(24).toString('base64url');
}

async function main() {
  const prisma = new PrismaClient();
  const supabase = buildSupabaseAdminClient();

  try {
    const users = await prisma.user.findMany({
      where: {
        supabaseId: null,
        OR: [{ passwordHash: { not: null } }, { password: { not: null } }],
      },
      select: {
        id: true,
        email: true,
        name: true,
        supabaseId: true,
        passwordHash: true,
      },
    });

    console.log(`Found ${users.length} Prisma users to sync`);

    for (const user of users) {
      const tempPassword = generatePassword();
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          name: user.name ?? undefined,
          source: 'prisma-sync',
        },
      });

      if (error || !data.user?.id) {
        console.error(`[sync] Failed for ${user.email}:`, error?.message || 'missing Supabase user id');
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { supabaseId: data.user.id },
      });

      console.log(`[sync] Linked ${user.email} -> ${data.user.id}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});