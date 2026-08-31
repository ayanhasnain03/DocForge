import { getPageImageUrl, source } from '@/lib/source';
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from 'fumadocs-ui/layouts/notebook/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { CategoryChildren } from '@/components/category-children';
import { getCategoryChildLinks } from '@/lib/category-children';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';

type DocsPageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function Page(props: DocsPageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const childLinks = getCategoryChildLinks(source.getPageTree(), page.url);

  const components = getMDXComponents({
    a: createRelativeLink(source, page),
  });

  return (
    <DocsPage toc={page.data.toc} full={page.data.full} breadcrumb={{ includeRoot: false }}>
      <header className="mb-6 space-y-2.5 sm:mb-8 sm:space-y-3">
        <DocsTitle className="!text-[clamp(1.75rem,4vw+0.75rem,2.5rem)] !font-normal !leading-[1.12] !tracking-[-0.03em]">
          {page.data.title}
        </DocsTitle>
        {page.data.description ? (
          <DocsDescription className="!mb-0 !max-w-3xl !text-[0.9375rem] !leading-relaxed !text-fd-muted-foreground sm:!text-base">
            {page.data.description}
          </DocsDescription>
        ) : null}
      </header>

      <DocsBody>
        <MDX components={components} />
      </DocsBody>

      <CategoryChildren items={childLinks} />
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams().filter((param) => {
    const slug = param.slug;
    return Array.isArray(slug) ? slug.length > 0 : Boolean(slug);
  });
}

export async function generateMetadata(
  props: DocsPageProps,
): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImageUrl(page).url,
    },
  };
}
