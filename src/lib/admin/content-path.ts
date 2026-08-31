export function encodeContentPath(relativePath: string): string {
  return relativePath.split('/').map(encodeURIComponent).join('/');
}
