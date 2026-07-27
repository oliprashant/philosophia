export const FORMS = [
  { id: 'essay', name: 'Essay', slug: 'essay' },
  { id: 'dialogue', name: 'Dialogue', slug: 'dialogue' },
  { id: 'poem', name: 'Poem', slug: 'poem' },
  { id: 'aphorism', name: 'Aphorism', slug: 'aphorism' },
  { id: 'letter', name: 'Letter', slug: 'letter' },
  { id: 'review', name: 'Review', slug: 'review' },
  { id: 'interview', name: 'Interview', slug: 'interview' },
] as const;

export type FormItem = (typeof FORMS)[number];

export function formSlugToGenre(slug: string) {
  const normalized = slug.trim().toLowerCase();
  const match = FORMS.find(form => form.slug === normalized);
  return match ? match.name.toUpperCase() : null;
}
