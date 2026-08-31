import type { ContentBlock } from '@/lib/admin/blocks';

function newId(): string {
  return crypto.randomUUID();
}

function dedent(content: string): string {
  return content
    .split('\n')
    .map((line) => line.replace(/^ {4}/, ''))
    .join('\n')
    .trim();
}

function parseTabsBlock(mdx: string): ContentBlock | null {
  const open = mdx.match(/^<Tabs items=\{(\[[\s\S]*?\])\}>/);
  if (!open || !mdx.endsWith('</Tabs>')) return null;

  const inner = mdx.slice(open[0].length, mdx.length - '</Tabs>'.length);
  const tabPattern = /<Tab value="([^"]*)">\s*([\s\S]*?)\s*<\/Tab>/g;
  const items: { label: string; content: string }[] = [];
  let match = tabPattern.exec(inner);

  while (match) {
    items.push({ label: match[1], content: dedent(match[2]) });
    match = tabPattern.exec(inner);
  }

  if (items.length === 0) return null;
  return { id: newId(), type: 'tabs', items };
}

function parseCalloutBlock(mdx: string): ContentBlock | null {
  const match = mdx.match(
    /^<Callout(?:\s+type="([^"]*)")?(?:\s+title="([^"]*)")?\s*>([\s\S]*?)<\/Callout>$/,
  );
  if (!match) return null;

  return {
    id: newId(),
    type: 'callout',
    calloutType:
      (match[1] as 'info' | 'warning' | 'error' | 'success' | 'idea' | undefined) || 'info',
    title: match[2] || undefined,
    content: dedent(match[3]),
  };
}

function parseAccordionsBlock(mdx: string): ContentBlock | null {
  const open = mdx.match(/^<Accordions(?:\s+type="(single|multiple)")?\s*>/);
  if (!open || !mdx.endsWith('</Accordions>')) return null;

  const inner = mdx.slice(open[0].length, mdx.length - '</Accordions>'.length);
  const itemPattern = /<Accordion title="([^"]*)">\s*([\s\S]*?)\s*<\/Accordion>/g;
  const items: { title: string; content: string }[] = [];
  let match = itemPattern.exec(inner);

  while (match) {
    items.push({ title: match[1], content: dedent(match[2]) });
    match = itemPattern.exec(inner);
  }

  if (items.length === 0) return null;

  return {
    id: newId(),
    type: 'accordions',
    accordionType: (open[1] as 'single' | 'multiple') || 'single',
    items,
  };
}

function parseStepsBlock(mdx: string): ContentBlock | null {
  if (!mdx.startsWith('<Steps>') || !mdx.endsWith('</Steps>')) return null;

  const inner = mdx.slice('<Steps>'.length, mdx.length - '</Steps>'.length);
  const stepPattern = /<Step>\s*([\s\S]*?)\s*<\/Step>/g;
  const items: string[] = [];
  let match = stepPattern.exec(inner);

  while (match) {
    items.push(dedent(match[1]));
    match = stepPattern.exec(inner);
  }

  if (items.length === 0) return null;
  return { id: newId(), type: 'steps', items };
}

function parseGithubBlock(mdx: string): ContentBlock | null {
  const match = mdx.match(/^<GithubInfo owner="([^"]*)" repo="([^"]*)"\s*\/>$/);
  if (!match) return null;
  return { id: newId(), type: 'github', owner: match[1], repo: match[2] };
}

export function parseMdxComponent(mdx: string): ContentBlock | null {
  const trimmed = mdx.trim();
  return (
    parseTabsBlock(trimmed) ??
    parseCalloutBlock(trimmed) ??
    parseAccordionsBlock(trimmed) ??
    parseStepsBlock(trimmed) ??
    parseGithubBlock(trimmed)
  );
}

export function mdxSegmentToBlockWithFallback(mdx: string): ContentBlock {
  const parsed = parseMdxComponent(mdx);
  if (parsed) return parsed;
  return { id: newId(), type: 'markdown', content: mdx };
}
