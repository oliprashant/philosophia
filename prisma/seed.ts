// prisma/seed.ts
// Run: npx prisma db seed
import { PrismaClient, Role, Genre } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@philosophia.blog' },
    update: {},
    create: {
      email: 'admin@philosophia.blog',
      name: 'The Editor',
      password: adminPassword,
      role: Role.ADMIN,
      bio: 'Curator of philosophical thought and editorial voice of Philosophia.',
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'ethics' },
      update: {},
      create: { name: 'Ethics', slug: 'ethics', description: 'The study of moral principles and human conduct.', color: '#8B4513' },
    }),
    prisma.category.upsert({
      where: { slug: 'metaphysics' },
      update: {},
      create: { name: 'Metaphysics', slug: 'metaphysics', description: 'The nature of reality, existence, and being.', color: '#4A0E8F' },
    }),
    prisma.category.upsert({
      where: { slug: 'existentialism' },
      update: {},
      create: { name: 'Existentialism', slug: 'existentialism', description: 'Individual freedom, choice, and authentic existence.', color: '#1A1A2E' },
    }),
    prisma.category.upsert({
      where: { slug: 'epistemology' },
      update: {},
      create: { name: 'Epistemology', slug: 'epistemology', description: 'The theory of knowledge and justified belief.', color: '#0D3B66' },
    }),
    prisma.category.upsert({
      where: { slug: 'aesthetics' },
      update: {},
      create: { name: 'Aesthetics', slug: 'aesthetics', description: 'Philosophy of art, beauty, and taste.', color: '#6B2737' },
    }),
  ]);

  // Create humours (philosophical taxonomy based on the four temperaments)
  const humours = await Promise.all([
    prisma.humour.upsert({
      where: { slug: 'melancholic' },
      update: {},
      create: {
        name: 'Melancholic',
        slug: 'melancholic',
        description: 'Dark, introspective, contemplating the absurd and the void.',
        color: '#2C3E50',
      },
    }),
    prisma.humour.upsert({
      where: { slug: 'sanguine' },
      update: {},
      create: {
        name: 'Sanguine',
        slug: 'sanguine',
        description: 'Optimistic, life-affirming, finding meaning in the everyday.',
        color: '#C0392B',
      },
    }),
    prisma.humour.upsert({
      where: { slug: 'choleric' },
      update: {},
      create: {
        name: 'Choleric',
        slug: 'choleric',
        description: 'Passionate, polemical, burning with intellectual fire.',
        color: '#E67E22',
      },
    }),
    prisma.humour.upsert({
      where: { slug: 'phlegmatic' },
      update: {},
      create: {
        name: 'Phlegmatic',
        slug: 'phlegmatic',
        description: 'Calm, systematic, approaching truth through patient reason.',
        color: '#27AE60',
      },
    }),
  ]);

  // Create tags
  const tagNames = ['Dostoevsky', 'Camus', 'Nietzsche', 'Sartre', 'Wittgenstein', 'Heidegger', 'Plato', 'Aristotle', 'Absurdism', 'Nihilism', 'Free Will', 'Consciousness', 'Language', 'Death', 'Freedom'];
  await Promise.all(
    tagNames.map(name =>
      prisma.tag.upsert({
        where: { slug: name.toLowerCase().replace(/\s+/g, '-') },
        update: {},
        create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
      })
    )
  );

  // Create sample post
  await prisma.post.upsert({
    where: { slug: 'the-silent-cry-of-the-absurd' },
    update: {},
    create: {
      title: 'The Silent Cry of the Absurd',
      slug: 'the-silent-cry-of-the-absurd',
      excerpt: 'Camus imagined Sisyphus happy. But what if happiness itself is the cruelest myth the absurd has to offer?',
      content: `<h2>The Myth Re-examined</h2>
<p>Albert Camus, in the closing lines of <em>The Myth of Sisyphus</em>, offers us one of philosophy's most audacious assertions: "One must imagine Sisyphus happy." The boulder rolls back. Sisyphus descends. He is happy.</p>
<p>But let us sit with the discomfort that Camus perhaps intended to leave unresolved. What if happiness — that most intimate and personal of experiences — is itself a philosophical problem?</p>
<h2>Between the Rock and the Void</h2>
<p>The absurd, as Camus frames it, is not the world itself, nor the human desire for clarity and meaning, but the confrontation between the two. We demand the world speak; the world remains silent. From this silence, the absurd is born.</p>
<p>Sisyphus, eternally condemned to his futile labour, stands as the emblem of this condition. He knows. He is fully conscious. And in that consciousness — Camus insists — he finds something like defiant joy.</p>
<h2>The Question We Dare Not Ask</h2>
<p>Yet there is a question lurking beneath Camus's beautiful resolution: Is the happiness of Sisyphus genuine, or is it the last philosophical comfort we offer ourselves because the alternative — raw, unsoftened meaninglessness — is too much to bear?</p>
<p>Perhaps what Camus gives us is not an answer but an ethic: the injunction to <em>live as if</em> Sisyphus is happy. Not because he is, but because the alternative is surrender.</p>`,
      published: true,
      featured: true,
      genre: Genre.ESSAY,
      readingTime: 8,
      authorId: admin.id,
      categoryId: categories[2].id, // existentialism
      humourId: humours[0].id, // melancholic
      publishedAt: new Date(),
    },
  });

  console.log('✅ Database seeded successfully');
  console.log(`👤 Admin: admin@philosophia.blog / admin123!`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
