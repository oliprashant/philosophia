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

(async () => {
  try {
    const email = process.argv[2];
    const pwd = process.argv[3] || 'SmokePass!234';
    if (!email) return console.error('Usage: node smoke_login.js <email> [password]');

    const resp = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pwd }),
    });
    console.log('login status', resp.status);
    const setCookie = resp.headers.get('set-cookie') || resp.headers.get('Set-Cookie');
    console.log('set-cookie header:', setCookie);
    const body = await resp.text();
    console.log('login body:', body);
    if (setCookie) {
      const cookie = setCookie.split(';')[0];
      const profileResp = await fetch('http://localhost:3000/api/user/profile', { headers: { Cookie: cookie } });
      console.log('profile status', profileResp.status);
      console.log('profile body', await profileResp.text());
    }
  } catch (e) {
    console.error(e);
    process.exit(2);
  }
})();
