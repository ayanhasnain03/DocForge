import type { ContentSource } from '@/lib/admin/content-types';

export function savedMessage(source: ContentSource | undefined, label: string): string {
  if (source === 'github') {
    return `${label} — pushed to GitHub. Site will update after deploy.`;
  }
  return label;
}
