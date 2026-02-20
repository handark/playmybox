import { getApiUrl } from "./utils";

interface PresignResponse {
  key: string;
  uploadUrl: string | null;
  useFallback?: boolean;
  expiresIn: number;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
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
   * Upload a single file using presigned URL flow with fallback
   * Primary: Presigned URL → Direct to R2 → Complete
   * Fallback: Direct upload through API (for local dev or when presigned fails)
   */
  async uploadFile<T = unknown>(file: File): Promise<T> {
    try {
      // Try presigned URL flow first
      const presign = await this.post<PresignResponse>("/tracks/upload/presign", {
        filename: file.name,
        contentType: file.type || "audio/mpeg",
      });

      if (presign.uploadUrl && !presign.useFallback) {
        // Direct upload to R2 with presigned URL
        const uploadRes = await fetch(presign.uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": "audio/mpeg" },
        });

        if (uploadRes.ok) {
          // Complete upload (parse metadata, create DB record)
          return this.post<T>("/tracks/upload/complete", {
            key: presign.key,
            filename: file.name,
          });
        }

        console.warn("Presigned upload failed, falling back to direct upload");
      }
    } catch (err) {
      console.warn("Presigned flow failed, using fallback:", err);
    }

    // Fallback: Direct upload through API
    // Works locally but has 4.5MB limit on Vercel
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
