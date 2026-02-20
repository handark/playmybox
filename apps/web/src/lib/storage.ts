import { put, del, head } from "@vercel/blob";

/**
 * Upload a file to Vercel Blob storage
 */
export async function uploadToStorage(
  filename: string,
  body: Buffer | Blob | ReadableStream,
  contentType: string
): Promise<string> {
  const blob = await put(filename, body, {
    access: "public",
    contentType,
  });

  return blob.url;
}

/**
 * Delete a file from Vercel Blob storage
 */
export async function deleteFromStorage(url: string): Promise<void> {
  await del(url);
}

/**
 * Check if a file exists and get its metadata
 */
export async function getStorageMetadata(url: string) {
  try {
    const metadata = await head(url);
    return metadata;
  } catch {
    return null;
  }
}

/**
 * Get the public URL for a blob (already public with Vercel Blob)
 */
export function getPublicUrl(url: string): string {
  return url;
}
