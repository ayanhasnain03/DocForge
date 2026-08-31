export const appName = 'Harc';

export const docsRoute = '/';

export const docsImageRoute = '/og';

export const docsContentRoute = '/llms.mdx';

export const gitConfig = {
  user: 'fuma-nama',
  repo: 'fumadocs',
  branch: 'main',
};

export const reservedRootPrefixes = [
  'admin',
  'api',
  'og',
  'llms.mdx',
  'llms.txt',
  'llms-full.txt',
  'uploads',
  '_next',
] as const;
