import { prisma } from "@/lib/prisma";
import { getR2PublicUrl } from "@/lib/storage";

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

    const publicUrl = `${getR2PublicUrl()}/${track.storageKey}`;
    const range = request.headers.get("range");

    const headers: HeadersInit = {};
    if (range) {
      headers["Range"] = range;
    }

    const r2Response = await fetch(publicUrl, { headers });

    if (!r2Response.ok && r2Response.status !== 206) {
      return new Response("Failed to stream track", { status: 500 });
    }

    const responseHeaders = new Headers({
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000",
    });

    const contentRange = r2Response.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    const contentLength = r2Response.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(r2Response.body, {
      status: r2Response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Stream error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
