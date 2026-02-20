import { put, del, head, getDownloadUrl } from "@vercel/blob";

/**
 * Upload a file to Vercel Blob storage (private store)
 */
export async function uploadToStorage(
  filename: string,
  body: Buffer | Blob | ReadableStream,
  contentType: string
): Promise<string> {
  const blob = await put(filename, body, {
    contentType,
    addRandomSuffix: false,
  });

  return blob.url;
}

/**
 * Get a signed download URL for a private blob (valid for 1 hour)
 */
export async function getSignedUrl(blobUrl: string): Promise<string> {
  const { url } = await getDownloadUrl(blobUrl);
  return url;
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
