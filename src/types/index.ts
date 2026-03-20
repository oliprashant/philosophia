// src/types/index.ts
// Shared TypeScript types used across the application

export type Role = 'READER' | 'AUTHOR' | 'ADMIN';
export type Genre = 'ESSAY' | 'DIALOGUE' | 'POEM' | 'APHORISM' | 'LETTER' | 'REVIEW' | 'INTERVIEW';
export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Author {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Humour {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
}

export interface PostSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  coverAlt: string | null;
  genre: Genre;
  readingTime: number | null;
  publishedAt: string | null;
  createdAt: string;
  author: Author;
  category: Category | null;
  humour: Humour | null;
  tags: Tag[];
  _count: { upvotes: number; comments: number };
}

export interface PostFull extends PostSummary {
  content: string;
  aiSummary: string | null;
  featured: boolean;
  updatedAt: string;
}

export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
  parentId: string | null;
  author: Author | null;
  guestName: string | null;
  _count: { upvotes: number };
  replies: CommentWithAuthor[];
}

export interface Highlight {
  id: string;
  text: string;
  color: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Pagination wrapper
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
