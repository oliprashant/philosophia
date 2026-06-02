// Canonical form (genre) taxonomy — backed by Post.genre enum in Prisma
import type { Genre } from '@prisma/client';

export type FormItem = {
  id: string;
  name: string;
  slug: string;
  genre: Genre;
};

export const FORMS: FormItem[] = [
  { id: 'ESSAY', name: 'Essay', slug: 'essay', genre: 'ESSAY' },
  { id: 'DIALOGUE', name: 'Dialogue', slug: 'dialogue', genre: 'DIALOGUE' },
  { id: 'POEM', name: 'Poem', slug: 'poem', genre: 'POEM' },
  { id: 'APHORISM', name: 'Aphorism', slug: 'aphorism', genre: 'APHORISM' },
  { id: 'LETTER', name: 'Letter', slug: 'letter', genre: 'LETTER' },
  { id: 'REVIEW', name: 'Review', slug: 'review', genre: 'REVIEW' },
  { id: 'INTERVIEW', name: 'Interview', slug: 'interview', genre: 'INTERVIEW' },
];

export function getFormBySlug(slug: string): FormItem | undefined {
  const normalized = slug.toLowerCase();
  return FORMS.find(f => f.slug === normalized);
}

/** Resolve ?form=essay or legacy ?genre=ESSAY to a Prisma Genre value */
export function resolveGenreFilter(formSlug?: string | null, genreParam?: string | null): Genre | undefined {
  if (formSlug) {
    const form = getFormBySlug(formSlug);
    return form?.genre;
  }
  if (!genreParam) return undefined;
  const upper = genreParam.toUpperCase();
  if (FORMS.some(f => f.genre === upper)) return upper as Genre;
  return undefined;
}

export function getFormsForApi(): Pick<FormItem, 'id' | 'name' | 'slug'>[] {
  return FORMS.map(({ id, name, slug }) => ({ id, name, slug }));
}
