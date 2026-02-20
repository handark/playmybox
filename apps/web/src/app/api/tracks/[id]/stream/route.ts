import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    const track = await prisma.track.findUnique({
      where: { id },
      select: { storageKey: true, fileSize: true },
    });

    if (!track) {
      return new Response("Track not found", { status: 404 });
    }

    // Fetch private blob with Bearer token authorization
    const range = request.headers.get("range");

    const headers: HeadersInit = {
      Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
    };
    if (range) {
      headers["Range"] = range;
    }

    const blobResponse = await fetch(track.storageKey, { headers });

    if (!blobResponse.ok && blobResponse.status !== 206) {
      return new Response("Failed to stream track", { status: 500 });
    }

    const responseHeaders = new Headers({
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=3600", // Cache for 1 hour (signed URL validity)
    });

    const contentRange = blobResponse.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    const contentLength = blobResponse.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(blobResponse.body, {
      status: blobResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
