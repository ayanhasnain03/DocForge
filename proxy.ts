import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { docsContentRoute, reservedRootPrefixes } from '@/lib/shared';

const { rewrite: rewriteDocs } = rewritePath(
  '/{*path}',
  `${docsContentRoute}/{*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  '/{*path}.md',
  `${docsContentRoute}/{*path}/content.md`,
);

function isReservedPath(pathname: string): boolean {
  const first = pathname.split('/').filter(Boolean)[0];
  if (!first) return false;
  return (reservedRootPrefixes as readonly string[]).includes(first);
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isReservedPath(pathname)) {
    return NextResponse.next();
  }

  const mdSuffix = rewriteSuffix(pathname);
  if (mdSuffix) {
    return NextResponse.rewrite(new URL(mdSuffix, request.nextUrl));
  }

  if (isMarkdownPreferred(request)) {
    const result = rewriteDocs(pathname);

    if (result) {
      return NextResponse.rewrite(new URL(result, request.nextUrl), {
        headers: { Vary: 'Accept' },
      });
    }
  }

  return NextResponse.next();
}
