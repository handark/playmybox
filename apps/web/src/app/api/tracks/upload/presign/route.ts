import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUser } from "@/lib/auth";
import { presignUploadSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = presignUploadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { contentType } = result.data;
    const key = `tracks/${randomUUID()}.mp3`;

    // Generate a presigned URL for direct upload to R2
    // Using Cloudflare's S3-compatible API
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucket = process.env.R2_BUCKET_NAME || "playmybox";
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      // If S3 credentials not available, return the key and let client use fallback
      // The complete endpoint will handle the upload
      return NextResponse.json({
        key,
        uploadUrl: null,
        useFallback: true,
        expiresIn: 3600,
      });
    }

    // Using AWS SDK for presigned URL
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    // Use R2_ENDPOINT if provided, otherwise construct from account ID
    const endpoint = process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType || "audio/mpeg",
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });

    return NextResponse.json({
      key,
      uploadUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
