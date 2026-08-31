export const appName = 'Harc';

export const docsRoute = '/';

export const docsImageRoute = '/og';

export const docsContentRoute = '/llms.mdx';

function resolveGitConfig() {
  const repoFull = process.env.GITHUB_REPO?.trim();
  if (repoFull?.includes('/')) {
    const [user, repo] = repoFull.split('/');
    if (user && repo) {
      return {
        user,
        repo,
        branch: process.env.GITHUB_BRANCH?.trim() || 'main',
      };
    }
  }

  return {
    user: 'fuma-nama',
    repo: 'fumadocs',
    branch: 'main',
  };
}

export const gitConfig = resolveGitConfig();

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
