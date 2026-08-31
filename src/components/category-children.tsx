import Link from 'next/link';
import type { CategoryChildLink } from '@/lib/category-children';

export function CategoryChildren({ items }: { items: CategoryChildLink[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-10 border-t border-[#212327] pt-8 sm:mt-14 sm:pt-10">
      <p className="mb-4 font-mono text-xs font-normal uppercase tracking-[0.12em] text-white sm:mb-5">
        In this section
      </p>
      <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, index) => (
          <li key={item.url} style={{ animationDelay: `${index * 80}ms` }}>
            <Link
              href={item.url}
              className="group flex h-full min-w-0 flex-col rounded-lg border border-[#212327] bg-[#191919] p-4 sm:p-5"
            >
              <span className="text-sm font-normal text-white">
                {item.name}
              </span>
              {item.description ? (
                <span className="mt-1.5 text-sm leading-relaxed text-[#7d8187]">
                  {item.description}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
