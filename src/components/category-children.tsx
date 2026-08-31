import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { CategoryChildLink } from '@/lib/category-children';

export function CategoryChildren({ items }: { items: CategoryChildLink[] }) {
  if (items.length === 0) return null;

  return (
    <section className="category-children">
      <p className="category-children-label">In this section</p>
      <ul className="category-children-grid">
        {items.map((item, index) => (
          <li
            key={item.url}
            className="category-children-item"
            style={{ '--index': index } as CSSProperties}
          >
            <Link href={item.url} className="category-children-link">
              <span className="category-children-title">{item.name}</span>
              {item.description ? (
                <span className="category-children-desc">{item.description}</span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
