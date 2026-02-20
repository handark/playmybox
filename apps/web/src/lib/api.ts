import { getApiUrl } from "./utils";

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
   * Upload a single file through API
   * Note: Limited to ~4.5MB on Vercel serverless functions
   * For larger files, Vercel Blob client upload needs proper configuration
   */
  async uploadFile<T = unknown>(file: File): Promise<T> {
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

  /**
   * Upload an image for an artist
   */
  async uploadArtistImage<T = unknown>(artistId: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`${this.baseUrl}/library/artists/${artistId}`, {
      method: "PATCH",
      headers: this.headers(),
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  }

  /**
   * Upload a cover for an album
   */
  async uploadAlbumCover<T = unknown>(albumId: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("cover", file);

    const res = await fetch(`${this.baseUrl}/library/albums/${albumId}`, {
      method: "PATCH",
      headers: this.headers(),
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    return res.json();
  }

  /**
   * Delete an artist and all related data
   */
  async deleteArtist(artistId: string): Promise<{ deleted: boolean }> {
    return this.delete(`/library/artists/${artistId}`);
  }

  /**
   * Delete an album and all related tracks
   */
  async deleteAlbum(albumId: string): Promise<{ deleted: boolean }> {
    return this.delete(`/library/albums/${albumId}`);
  }
}

export const api = new ApiClient();
