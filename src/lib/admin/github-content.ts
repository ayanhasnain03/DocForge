import type { ContentNode, DocFile, DocFrontmatter, MetaFile } from '@/lib/admin/content-types';
import { slugifyTitle } from '@/lib/admin/content-types';
import {
  normalizeRelativePath,
  parseDoc,
  parseMeta,
  serializeDoc,
  serializeMeta,
} from '@/lib/admin/content-format';

type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  contentPrefix: string;
};

type GitHubFile = {
  content: string;
  sha: string;
};

function getConfig(): GitHubConfig {
  const token = process.env.GITHUB_TOKEN;
  const repoFull = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH ?? 'main';
  const contentPrefix = (process.env.GITHUB_CONTENT_PREFIX ?? 'content/docs').replace(/\/$/, '');

  if (!token) {
    throw new Error('GITHUB_TOKEN is not configured');
  }
  if (!repoFull?.includes('/')) {
    throw new Error('GITHUB_REPO must be set to owner/repo');
  }

  const [owner, repo] = repoFull.split('/');
  if (!owner || !repo) {
    throw new Error('GITHUB_REPO must be set to owner/repo');
  }

  return { token, owner, repo, branch, contentPrefix };
}

function toRepoPath(relativePath: string, config: GitHubConfig): string {
  const normalized = normalizeRelativePath(relativePath);
  return `${config.contentPrefix}/${normalized}`;
}

function fromRepoPath(repoPath: string, config: GitHubConfig): string | null {
  const prefix = `${config.contentPrefix}/`;
  if (!repoPath.startsWith(prefix)) return null;
  return repoPath.slice(prefix.length);
}

function decodeGitHubContent(content: string): string {
  return Buffer.from(content.replace(/\n/g, ''), 'base64').toString('utf8');
}

async function githubRequest<T>(
  config: GitHubConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `GitHub API error (${response.status})`;
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      // Response body is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function encodeRepoPath(repoPath: string): string {
  return repoPath.split('/').map(encodeURIComponent).join('/');
}

async function readRepoFile(
  config: GitHubConfig,
  relativePath: string,
): Promise<GitHubFile | null> {
  const repoPath = toRepoPath(relativePath, config);

  try {
    const data = await githubRequest<{
      content: string;
      sha: string;
      encoding: string;
    }>(
      config,
      `/repos/${config.owner}/${config.repo}/contents/${encodeRepoPath(repoPath)}?ref=${encodeURIComponent(config.branch)}`,
    );

    if (data.encoding !== 'base64') {
      throw new Error('Unexpected GitHub file encoding');
    }

    return {
      content: decodeGitHubContent(data.content),
      sha: data.sha,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('(404)')) {
      return null;
    }
    throw error;
  }
}

async function writeRepoFile(
  config: GitHubConfig,
  relativePath: string,
  content: string,
  message: string,
): Promise<void> {
  const repoPath = toRepoPath(relativePath, config);
  const existing = await readRepoFile(config, relativePath);

  const body: Record<string, string> = {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch: config.branch,
  };

  if (existing?.sha) {
    body.sha = existing.sha;
  }

  await githubRequest(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodeRepoPath(repoPath)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
}

async function deleteRepoFile(
  config: GitHubConfig,
  relativePath: string,
  message: string,
): Promise<void> {
  const repoPath = toRepoPath(relativePath, config);
  const existing = await readRepoFile(config, relativePath);
  if (!existing) {
    throw new Error('File not found');
  }

  await githubRequest(
    config,
    `/repos/${config.owner}/${config.repo}/contents/${encodeRepoPath(repoPath)}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        sha: existing.sha,
        branch: config.branch,
      }),
    },
  );
}

async function listRelativeContentPaths(config: GitHubConfig): Promise<string[]> {
  const ref = await githubRequest<{ object: { sha: string } }>(
    config,
    `/repos/${config.owner}/${config.repo}/git/ref/heads/${encodeURIComponent(config.branch)}`,
  );

  const commit = await githubRequest<{ tree: { sha: string } }>(
    config,
    `/repos/${config.owner}/${config.repo}/git/commits/${ref.object.sha}`,
  );

  const tree = await githubRequest<{
    tree: Array<{ path: string; type: string }>;
  }>(
    config,
    `/repos/${config.owner}/${config.repo}/git/trees/${commit.tree.sha}?recursive=1`,
  );

  const paths: string[] = [];
  for (const entry of tree.tree) {
    if (entry.type !== 'blob') continue;
    const relative = fromRepoPath(entry.path, config);
    if (!relative) continue;
    if (relative.endsWith('.mdx') || relative.endsWith('meta.json')) {
      paths.push(relative);
    }
  }

  return paths.sort((a, b) => a.localeCompare(b));
}

function buildTreeFromPaths(paths: string[]): ContentNode[] {
  interface Dir {
    files: Array<{ name: string; path: string }>;
    subdirs: Map<string, Dir>;
  }

  const root: Dir = { files: [], subdirs: new Map() };

  for (const relPath of paths) {
    const parts = relPath.split('/');
    const fileName = parts.pop();
    if (!fileName) continue;

    let dir = root;
    let dirPath = '';

    for (const part of parts) {
      dirPath = dirPath ? `${dirPath}/${part}` : part;
      if (!dir.subdirs.has(part)) {
        dir.subdirs.set(part, { files: [], subdirs: new Map() });
      }
      dir = dir.subdirs.get(part)!;
    }

    dir.files.push({ name: fileName, path: relPath });
  }

  function toNodes(dir: Dir, rel = ''): ContentNode[] {
    const nodes: ContentNode[] = [];

    for (const [name, sub] of [...dir.subdirs.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      const subPath = rel ? `${rel}/${name}` : name;
      nodes.push({
        type: 'folder',
        name,
        path: subPath,
        children: toNodes(sub, subPath),
      });
    }

    for (const file of dir.files.sort((a, b) => a.name.localeCompare(b.name))) {
      nodes.push({ type: 'file', name: file.name, path: file.path });
    }

    return nodes;
  }

  return toNodes(root);
}

function commitMessage(action: string, relativePath: string): string {
  return `docs(admin): ${action} ${relativePath}`;
}

export async function listContentTree(): Promise<ContentNode[]> {
  const config = getConfig();
  const paths = await listRelativeContentPaths(config);
  return buildTreeFromPaths(paths);
}

export async function readDoc(relativePath: string): Promise<DocFile> {
  if (!relativePath.endsWith('.mdx')) {
    throw new Error('Document path must end with .mdx');
  }

  const config = getConfig();
  const file = await readRepoFile(config, relativePath);
  if (!file) {
    throw new Error('Not found');
  }

  return parseDoc(relativePath, file.content);
}

export async function writeDoc(
  relativePath: string,
  frontmatter: DocFrontmatter,
  body: string,
): Promise<void> {
  if (!relativePath.endsWith('.mdx')) {
    throw new Error('Document path must end with .mdx');
  }

  const config = getConfig();
  const content = serializeDoc(frontmatter, body);
  await writeRepoFile(
    config,
    relativePath,
    content,
    commitMessage('update', relativePath),
  );
}

export async function deleteDoc(relativePath: string): Promise<void> {
  const config = getConfig();
  await deleteRepoFile(config, relativePath, commitMessage('delete', relativePath));
}

export async function deleteFolder(relativePath: string): Promise<void> {
  const config = getConfig();
  const prefix = `${relativePath.replace(/\/$/, '')}/`;
  const paths = await listRelativeContentPaths(config);
  const targets = paths.filter(
    (entry) => entry === relativePath.replace(/\/$/, '') || entry.startsWith(prefix),
  );

  if (targets.length === 0) {
    throw new Error('Folder not found');
  }

  for (const target of [...targets].sort((a, b) => b.length - a.length)) {
    await deleteRepoFile(config, target, commitMessage('delete', target));
  }
}

export async function renameFile(
  relativePath: string,
  newName: string,
): Promise<{ path: string }> {
  if (relativePath.endsWith('meta.json')) {
    throw new Error('Navigation files cannot be renamed.');
  }

  const slug = slugifyTitle(newName);
  if (!slug) {
    throw new Error('Name is required.');
  }

  const dir = relativePath.includes('/')
    ? relativePath.slice(0, relativePath.lastIndexOf('/'))
    : '';
  const extension = relativePath.endsWith('.mdx') ? '.mdx' : '';
  if (!extension) {
    throw new Error('Only MDX files can be renamed.');
  }

  const newRelativePath = dir ? `${dir}/${slug}${extension}` : `${slug}${extension}`;
  if (newRelativePath === relativePath) {
    return { path: relativePath };
  }

  const config = getConfig();
  const file = await readRepoFile(config, relativePath);
  if (!file) {
    throw new Error('File not found');
  }

  const existing = await readRepoFile(config, newRelativePath);
  if (existing) {
    throw new Error('A file with that name already exists.');
  }

  await writeRepoFile(
    config,
    newRelativePath,
    file.content,
    commitMessage('rename', `${relativePath} -> ${newRelativePath}`),
  );
  await deleteRepoFile(
    config,
    relativePath,
    commitMessage('rename', `${relativePath} -> ${newRelativePath}`),
  );

  return { path: newRelativePath };
}

export async function renameFolder(
  relativePath: string,
  newName: string,
): Promise<{ path: string }> {
  const slug = slugifyTitle(newName);
  if (!slug) {
    throw new Error('Name is required.');
  }

  const parent = relativePath.includes('/')
    ? relativePath.slice(0, relativePath.lastIndexOf('/'))
    : '';
  const newRelativePath = parent ? `${parent}/${slug}` : slug;

  if (newRelativePath === relativePath) {
    return { path: relativePath };
  }

  const config = getConfig();
  const prefix = `${relativePath.replace(/\/$/, '')}/`;
  const paths = await listRelativeContentPaths(config);
  const targets = paths.filter(
    (entry) => entry === relativePath.replace(/\/$/, '') || entry.startsWith(prefix),
  );

  if (targets.length === 0) {
    throw new Error('Folder not found');
  }

  const existingPrefix = await listRelativeContentPaths(config);
  if (existingPrefix.some((entry) => entry === newRelativePath || entry.startsWith(`${newRelativePath}/`))) {
    throw new Error('A folder with that name already exists.');
  }

  for (const target of [...targets].sort((a, b) => a.length - b.length)) {
    const suffix = target === relativePath ? '' : target.slice(prefix.length);
    const nextPath = suffix ? `${newRelativePath}/${suffix}` : newRelativePath;
    const file = await readRepoFile(config, target);
    if (!file) continue;

    await writeRepoFile(
      config,
      nextPath,
      file.content,
      commitMessage('rename', `${target} -> ${nextPath}`),
    );
  }

  for (const target of [...targets].sort((a, b) => b.length - a.length)) {
    await deleteRepoFile(
      config,
      target,
      commitMessage('rename', `${relativePath} -> ${newRelativePath}`),
    );
  }

  return { path: newRelativePath };
}

export async function readMeta(relativePath: string): Promise<MetaFile> {
  if (!relativePath.endsWith('meta.json')) {
    throw new Error('Meta path must end with meta.json');
  }

  const config = getConfig();
  const file = await readRepoFile(config, relativePath);
  if (!file) {
    throw new Error('Not found');
  }

  return parseMeta(relativePath, file.content);
}

export async function writeMeta(
  relativePath: string,
  data: Record<string, unknown>,
): Promise<void> {
  const config = getConfig();
  const content = serializeMeta(data);
  await writeRepoFile(
    config,
    relativePath,
    content,
    commitMessage('update', relativePath),
  );
}
