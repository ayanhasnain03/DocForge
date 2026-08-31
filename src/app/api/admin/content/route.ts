import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import {
  listContentTree,
  slugifyTitle,
  writeDoc,
  writeMeta,
  getContentSource,
} from '@/lib/admin/content-store';
import { ValidationError, assertCreatePayload } from '@/lib/admin/validate';

async function requireAuth() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAuth();
  if (denied) return denied;

  const tree = await listContentTree();
  return NextResponse.json({ tree, source: getContentSource() });
}

export async function POST(request: Request) {
  const denied = await requireAuth();
  if (denied) return denied;

  let body: {
    kind?: 'page' | 'folder' | 'meta';
    path?: string;
    title?: string;
    parent?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  try {
    assertCreatePayload(body.kind, body.title);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const title = body.title!.trim();
  const parent = body.parent?.replace(/\/$/, '') ?? '';

  try {
    if (body.kind === 'meta') {
      const metaPath = body.path ?? 'meta.json';
      const data = {
        title,
        pages: ['...'],
      };
      await writeMeta(metaPath, data);
      return NextResponse.json({ path: metaPath, source: getContentSource() });
    }

    if (body.kind === 'folder') {
      const slug = slugifyTitle(title);
      const base = parent ? `${parent}/${slug}` : slug;

      await writeMeta(`${base}/meta.json`, {
        title,
        pages: ['index', '...'],
        defaultOpen: true,
        collapsible: true,
      });

      await writeDoc(
        `${base}/index.mdx`,
        { title, description: '' },
        `## ${title}\n\nStart writing here.`,
      );

      return NextResponse.json({ path: `${base}/index.mdx`, source: getContentSource() });
    }

    const slug = slugifyTitle(title);
    const docPath = parent ? `${parent}/${slug}.mdx` : `${slug}.mdx`;

    await writeDoc(
      docPath,
      { title, description: '' },
      `## Overview\n\nStart writing here.`,
    );

    return NextResponse.json({ path: docPath, source: getContentSource() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create item';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
