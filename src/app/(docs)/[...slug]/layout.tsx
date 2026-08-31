import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { isolateSectionTree } from '@/lib/category-children';
import { DocsHeader } from '@/components/docs-header';

export default async function Layout({
  children,
  params,
}: LayoutProps<'/[...slug]'>) {
  const { slug } = await params;
  const { nav, ...options } = baseOptions();

  return (
    <DocsLayout
      tree={isolateSectionTree(source.getPageTree(), slug)}
      {...options}
      nav={{
        ...nav,
        mode: 'top',
      }}
      sidebar={{
        collapsible: false,
      }}
      tabs={false}
      slots={{
        header: DocsHeader,
      }}
    >
      {children}
    </DocsLayout>
  );
}
