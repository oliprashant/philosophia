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

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

(async()=>{
  try {
    const email = process.argv[2];
    if (!email) return console.error('Usage: node create_password_reset.js <email>');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return console.error('User not found');

    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1000*60*60); // 1 hour

    const pr = await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
    console.log('created token:', token);
    await prisma.$disconnect();
  } catch (e) { console.error(e); process.exit(2); }
})();
