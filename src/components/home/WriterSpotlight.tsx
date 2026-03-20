// src/components/home/WriterSpotlight.tsx
import Link from 'next/link';
import Image from 'next/image';
import { PenLine } from 'lucide-react';

interface Author { id: string; name: string | null; image: string | null; bio: string | null; _count: { posts: number } }

export default function WriterSpotlight({ authors }: { authors: Author[] }) {
  return (
    <section>
      <h2 className="section-title mb-8">Our Writers</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {authors.map(author => (
          <Link
            key={author.id}
            href={`/writers/${author.id}`}
            className="group flex flex-col items-center text-center p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-all"
          >
            {author.image ? (
              <Image src={author.image} alt={author.name ?? ''} width={64} height={64} className="rounded-full mb-3 border-2 border-[var(--border)] group-hover:border-[var(--accent)] transition-colors" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xl font-sans mb-3">
                {author.name?.[0]}
              </div>
            )}
            <h3 className="font-medium text-sm mb-1 group-hover:text-[var(--accent)] transition-colors" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {author.name}
            </h3>
            <p className="text-xs font-sans text-[var(--text-faint)] flex items-center gap-1">
              <PenLine size={10} /> {author._count.posts} essays
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
