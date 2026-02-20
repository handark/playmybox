import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getApiUrl(): string {
  // In Next.js with API routes, use relative path for same-origin requests
  return process.env.NEXT_PUBLIC_API_URL || "/api";
}

/**
 * Get the display URL for an image stored in Vercel Blob (private store)
 * Routes through proxy to get signed URL
 */
export function getImageUrl(blobUrl: string | null | undefined): string | undefined {
  if (!blobUrl) return undefined;

  // If it's a Vercel Blob URL, proxy it
  if (blobUrl.includes("blob.vercel-storage.com")) {
    return `/api/images?url=${encodeURIComponent(blobUrl)}`;
  }

  // Otherwise return as-is (for external URLs or legacy data)
  return blobUrl;
}
