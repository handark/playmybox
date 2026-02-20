const accountId = process.env.R2_ACCOUNT_ID || "";
const bucket = process.env.R2_BUCKET_NAME || "playmybox";
const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";
const publicUrl = process.env.R2_PUBLIC_URL || "";

function getApiBase(): string {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects`;
}

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const res = await fetch(`${getApiBase()}/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": contentType,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed (${res.status}): ${text}`);
  }

  return getPublicUrl(key);
}

export async function getObjectFromR2(
  key: string,
  range?: string
): Promise<{
  body: ReadableStream<Uint8Array>;
  contentLength: number;
  contentRange?: string;
  contentType?: string;
  status: number;
}> {
  const headers: Record<string, string> = {};
  if (range) {
    headers["Range"] = range;
  }

  const res = await fetch(`${publicUrl}/${key}`, { headers });

  if (!res.ok && res.status !== 206) {
    throw new Error(`R2 get failed (${res.status})`);
  }

  return {
    body: res.body!,
    contentLength: parseInt(res.headers.get("content-length") || "0", 10),
    contentRange: res.headers.get("content-range") || undefined,
    contentType: res.headers.get("content-type") || undefined,
    status: res.status,
  };
}

export async function deleteFromR2(key: string): Promise<void> {
  const res = await fetch(`${getApiBase()}/${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 delete failed (${res.status}): ${text}`);
  }
}

export function getPublicUrl(key: string): string {
  if (publicUrl) {
    return `${publicUrl}/${key}`;
  }
  return key;
}

// For presigned URL upload flow
export function getR2PublicUrl(): string {
  return publicUrl;
}
