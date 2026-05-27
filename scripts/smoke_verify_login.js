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
    const email = process.argv[2];
    if (!email) return console.error('Usage: node smoke_verify_login.js <email>');

    const prisma = new PrismaClient();
    const token = await prisma.verificationToken.findFirst({ where: { identifier: email }, orderBy: { expires: 'desc' } });
    if (!token) {
      console.log('No token found for', email);
      await prisma.$disconnect();
      return;
    }

    const otp = token.token;
    console.log('Using OTP:', otp);

    const verifyResp = await fetch('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    console.log('verify status', verifyResp.status);
    const setCookie = verifyResp.headers.get('set-cookie') || verifyResp.headers.get('Set-Cookie');
    console.log('set-cookie header:', setCookie);
    const verifyBody = await verifyResp.text();
    console.log('verify body:', verifyBody);

    if (setCookie) {
      // extract cookie name=value
      const cookie = setCookie.split(';')[0];
      const profileResp = await fetch('http://localhost:3000/api/user/profile', {
        method: 'GET',
        headers: { Cookie: cookie },
      });
      console.log('profile status', profileResp.status);
      console.log('profile body', await profileResp.text());
    }

    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
