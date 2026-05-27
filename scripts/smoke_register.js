const fs = require('fs');
const path = require('path');
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    let v = line.slice(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    process.env[k] = v;
  }
}

loadEnv(path.join(process.cwd(), '.env.local'));
loadEnv(path.join(process.cwd(), '.env'));

const fetch = global.fetch || require('node-fetch');
const { PrismaClient } = require('@prisma/client');

(async () => {
  try {
    const ts = Date.now();
    const email = process.argv[2] || `smoke.${ts}@example.com`;
    const pwd = 'SmokePass!234';

    console.log('Registering:', email);
    const resp = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke User', email, password: pwd }),
    });
    const body = await resp.text();
    console.log('Register status:', resp.status);
    console.log('Register body:', body);

    const prisma = new PrismaClient();
    const token = await prisma.verificationToken.findFirst({ where: { identifier: email }, orderBy: { expires: 'desc' } });
    console.log('OTP token from DB:', token?.token || '(none)');
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
