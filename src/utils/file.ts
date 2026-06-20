/**
 * Formats a size in bytes into a human-readable string.
 * Limit of 100 lines for utility files is respected here.
 */
export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Resolves a file/blob URI into a standard Blob object (useful on Web platform).
 */
export async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}
