import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import {
  deleteDoc,
  deleteFolder,
  readDoc,
  readMeta,
  renameFile,
  renameFolder,
  writeDoc,
  writeMeta,
  getContentSource,
} from '@/lib/admin/content-store';
import { ValidationError, assertDocPayload, assertMetaPayload, assertRenamePayload } from '@/lib/admin/validate';

type RouteContext = { params: Promise<{ path: string[] }> };

async function requireAuth() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

function joinPath(segments: string[]): string {
  return segments.map((s) => decodeURIComponent(s)).join('/');
}

export async function GET(_request: Request, context: RouteContext) {
  const denied = await requireAuth();
  if (denied) return denied;

  const relativePath = joinPath((await context.params).path);

  try {
    if (relativePath.endsWith('meta.json')) {
      const meta = await readMeta(relativePath);
      return NextResponse.json(meta);
    }
    const doc = await readDoc(relativePath);
    return NextResponse.json(doc);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Not found';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAuth();
  if (denied) return denied;

  const relativePath = joinPath((await context.params).path);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  try {
    if (relativePath.endsWith('meta.json')) {
      const data = (payload as { data?: Record<string, unknown> }).data;
      if (!data || typeof data !== 'object') {
        return NextResponse.json({ error: 'Navigation data is missing.' }, { status: 400 });
      }
      assertMetaPayload(data);
      await writeMeta(relativePath, data);
      return NextResponse.json({ ok: true, source: getContentSource() });
    }

    const docPayload = payload as {
      frontmatter?: { title?: string; description?: string };
      body?: string;
    };

    if (!docPayload.frontmatter || typeof docPayload.frontmatter !== 'object') {
      return NextResponse.json({ error: 'Frontmatter is missing.' }, { status: 400 });
    }

    const body = String(docPayload.body ?? '');
    assertDocPayload(docPayload.frontmatter, body);
    await writeDoc(
      relativePath,
      {
        title: docPayload.frontmatter.title!.trim(),
        description: docPayload.frontmatter.description?.trim() || undefined,
      },
      body,
    );
    return NextResponse.json({ ok: true, source: getContentSource() });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Save failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAuth();
  if (denied) return denied;

  const relativePath = joinPath((await context.params).path);

  let payload: { name?: string };
  try {
    payload = (await request.json()) as { name?: string };
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  try {
    assertRenamePayload(payload.name);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const name = payload.name!.trim();

  try {
    if (relativePath.endsWith('.mdx')) {
      const result = await renameFile(relativePath, name);
      return NextResponse.json({ ...result, source: getContentSource() });
    }

    if (relativePath.endsWith('meta.json')) {
      return NextResponse.json(
        { error: 'Navigation files cannot be renamed.' },
        { status: 400 },
      );
    }

    const result = await renameFolder(relativePath, name);
    return NextResponse.json({ ...result, source: getContentSource() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Rename failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAuth();
  if (denied) return denied;

  const relativePath = joinPath((await context.params).path);

  try {
    if (relativePath.endsWith('.mdx') || relativePath.endsWith('meta.json')) {
      await deleteDoc(relativePath);
    } else {
      await deleteFolder(relativePath);
    }
    return NextResponse.json({ ok: true, source: getContentSource() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
