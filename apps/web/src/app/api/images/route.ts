import { NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/storage";

// Proxy endpoint to get signed URLs for private blob images
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    // Only allow Vercel Blob URLs
    if (!url.includes("blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const signedUrl = await getSignedUrl(url);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json(
      { error: "Failed to get image" },
      { status: 500 }
    );
  }
}
