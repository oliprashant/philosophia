const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    const email = process.argv[2];
    if (!email) return console.log('');
    const token = await prisma.verificationToken.findFirst({ where: { identifier: email }, orderBy: { expires: 'desc' } });
    console.log(token ? token.token : '');
  } catch (e) {
    console.error(e);
    process.exit(2);
  } finally {
    await prisma.$disconnect();
  }
})();
