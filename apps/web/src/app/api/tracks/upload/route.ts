import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import * as musicMetadata from "music-metadata";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadToR2, getPublicUrl } from "@/lib/storage";

// Direct upload endpoint for small files (bypasses presigned URLs)
// Use for local development or when presigned URLs aren't working
// Note: This has a body size limit (4.5MB on Vercel, unlimited locally)
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.includes("audio/") && !file.name.toLowerCase().endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Only audio files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

    // Upload to R2 using Cloudflare API
    const key = `tracks/${randomUUID()}.mp3`;
    await uploadToR2(key, buffer, "audio/mpeg");

    // Parse metadata
    const metadata = await musicMetadata.parseBuffer(buffer, {
      mimeType: "audio/mpeg",
    });

    const common = metadata.common;
    const format = metadata.format;

    // Find or create artist
    const artistName = common.artist || "Unknown Artist";
    const artist = await prisma.artist.upsert({
      where: { name: artistName },
      update: {},
      create: { name: artistName },
    });

    // Find or create album
    let album = null;
    if (common.album) {
      album = await prisma.album.upsert({
        where: {
          name_artistId: { name: common.album, artistId: artist.id },
        },
        update: {},
        create: {
          name: common.album,
          artistId: artist.id,
          year: common.year,
        },
      });
    }

    // Extract and upload cover art
    let coverUrl: string | null = null;
    const picture = common.picture?.[0];
    if (picture) {
      const coverKey = `covers/${randomUUID()}.${picture.format === "image/png" ? "png" : "jpg"}`;
      await uploadToR2(coverKey, Buffer.from(picture.data), picture.format);
      coverUrl = getPublicUrl(coverKey);

      // Update album cover if it doesn't have one
      if (album && !album.coverUrl) {
        await prisma.album.update({
          where: { id: album.id },
          data: { coverUrl },
        });
      }

      // Update artist image if it doesn't have one
      if (!artist.imageUrl) {
        await prisma.artist.update({
          where: { id: artist.id },
          data: { imageUrl: coverUrl },
        });
      }
    }

    // Create track
    const track = await prisma.track.create({
      data: {
        title: common.title || file.name.replace(/\.mp3$/i, ""),
        artistId: artist.id,
        albumId: album?.id,
        genre: common.genre?.[0] || null,
        duration: format.duration || 0,
        year: common.year,
        coverUrl,
        storageKey: key,
        fileSize,
      },
      include: {
        artist: true,
        album: true,
      },
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
