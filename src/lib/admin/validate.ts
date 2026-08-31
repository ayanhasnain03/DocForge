export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateDocPayload(
  frontmatter: { title?: string; description?: string },
  body: string,
): ValidationResult {
  const title = frontmatter.title?.trim() ?? '';
  if (!title) {
    return { ok: false, error: 'Title is required before saving.' };
  }

  if (title.length > 120) {
    return { ok: false, error: 'Title must be 120 characters or fewer.' };
  }

  const description = frontmatter.description?.trim();
  if (description && description.length > 300) {
    return { ok: false, error: 'Description must be 300 characters or fewer.' };
  }

  if (body.includes('<Tabs')) {
    const labelsMatch = body.match(/<Tabs items=\{(\[[\s\S]*?\])\}>/);
    if (!labelsMatch) {
      return { ok: false, error: 'Tabs block is missing a valid items list.' };
    }

    try {
      const labels = JSON.parse(labelsMatch[1]) as string[];
      if (!Array.isArray(labels) || labels.length === 0) {
        return { ok: false, error: 'Tabs must include at least one tab label.' };
      }

      for (const label of labels) {
        const tabTag = `<Tab value="${label}">`;
        if (!body.includes(tabTag)) {
          return {
            ok: false,
            error: `Tabs block is missing a <Tab> for label "${label}".`,
          };
        }
      }
    } catch {
      return { ok: false, error: 'Tabs items list is not valid JSON.' };
    }
  }

  return { ok: true };
}

export function validateMetaPayload(data: Record<string, unknown>): ValidationResult {
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) {
    return { ok: false, error: 'Sidebar title is required before saving.' };
  }

  if (data.pages !== undefined && !Array.isArray(data.pages)) {
    return { ok: false, error: 'Navigation pages must be an array.' };
  }

  const pages = (data.pages as unknown[]) ?? [];
  const hasEmpty = pages.some((entry) => typeof entry !== 'string' || !entry.trim());
  if (hasEmpty) {
    return { ok: false, error: 'Remove empty page entries from navigation.' };
  }

  return { ok: true };
}

export function validateCreatePayload(
  kind: string | undefined,
  title: string | undefined,
): ValidationResult {
  if (kind !== 'page' && kind !== 'folder' && kind !== 'meta') {
    return { ok: false, error: 'Invalid item type.' };
  }

  const trimmed = title?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Title is required.' };
  }

  if (trimmed.length > 120) {
    return { ok: false, error: 'Title must be 120 characters or fewer.' };
  }

  return { ok: true };
}

export function validateRenamePayload(name: string | undefined): ValidationResult {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) {
    return { ok: false, error: 'Name is required.' };
  }

  if (trimmed.length > 120) {
    return { ok: false, error: 'Name must be 120 characters or fewer.' };
  }

  return { ok: true };
}

export function assertRenamePayload(name: string | undefined): void {
  const result = validateRenamePayload(name);
  if (!result.ok) throw new ValidationError(result.error);
}

export function assertCreatePayload(kind: string | undefined, title: string | undefined): void {
  const result = validateCreatePayload(kind, title);
  if (!result.ok) throw new ValidationError(result.error);
}

export function assertDocPayload(
  frontmatter: { title?: string; description?: string },
  body: string,
): void {
  const result = validateDocPayload(frontmatter, body);
  if (!result.ok) throw new ValidationError(result.error);
}

export function assertMetaPayload(data: Record<string, unknown>): void {
  const result = validateMetaPayload(data);
  if (!result.ok) throw new ValidationError(result.error);
}
