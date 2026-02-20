import { upload } from "@vercel/blob/client";
import { getApiUrl } from "./utils";

class ApiClient {
  private baseUrl: string;
  private isLocalhost: boolean;

  constructor() {
    this.baseUrl = getApiUrl();
    this.isLocalhost = typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = { ...extra };
    const token = this.getToken();
    if (token) {
      h["Authorization"] = `Bearer ${token}`;
    }
    return h;
  }

  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async post<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "PATCH",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async delete<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  /**
   * Upload a single file using Vercel Blob client upload
   * Falls back to direct API upload for localhost (CORS issues with Blob)
   */
  async uploadFile<T = unknown>(file: File): Promise<T> {
    // Use direct API upload for localhost (Vercel Blob client has CORS issues locally)
    if (this.isLocalhost) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${this.baseUrl}/tracks/upload`, {
        method: "POST",
        headers: this.headers(),
        body: formData,
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    }

    // Production: Upload directly to Vercel Blob with client upload
    const blob = await upload(file.name, file, {
      access: "public",
      handleUploadUrl: "/api/tracks/upload/blob",
      clientPayload: JSON.stringify({
        token: this.getToken(),
      }),
    });

    // Complete the upload (parse metadata, create DB record)
    return this.post<T>("/tracks/upload/complete", {
      key: blob.url,
      filename: file.name,
    });
  }

  /**
   * Upload multiple files with progress callback
   */
  async uploadFiles<T = unknown>(
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<T[]> {
    const results: T[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadFile<T>(files[i]);
      results.push(result);
      onProgress?.(((i + 1) / files.length) * 100);
    }

    return results;
  }

  getStreamUrl(trackId: string): string {
    return `${this.baseUrl}/tracks/${trackId}/stream`;
  }
}

export const api = new ApiClient();
