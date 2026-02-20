import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

// This endpoint handles Vercel Blob client uploads
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authenticate the user from client payload
        let userId: string | null = null;

        if (clientPayload) {
          try {
            const payload = JSON.parse(clientPayload);
            if (payload.token) {
              const tokenPayload = await verifyToken(payload.token);
              if (tokenPayload) {
                userId = tokenPayload.sub;
              }
            }
          } catch {
            // Token verification failed
          }
        }

        if (!userId) {
          throw new Error("Unauthorized");
        }

        return {
          allowedContentTypes: ["audio/mpeg", "audio/mp3", "application/octet-stream"],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB max
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
