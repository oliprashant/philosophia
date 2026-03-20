// src/components/layout/Breadcrumbs.tsx
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem { label: string; href: string }

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex items-center flex-wrap gap-1" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-1"
            itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem"
          >
            {i < items.length - 1 ? (
              <>
                <Link
                  href={item.href}
                  className="text-xs font-sans text-[var(--text-faint)] hover:text-[var(--accent)] transition-colors"
                  itemProp="item"
                >
                  <span itemProp="name">{item.label}</span>
                </Link>
                <ChevronRight size={12} className="text-[var(--border)]" />
              </>
            ) : (
              <span className="text-xs font-sans text-[var(--text-muted)] line-clamp-1 max-w-[200px]" itemProp="name">
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(i + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
