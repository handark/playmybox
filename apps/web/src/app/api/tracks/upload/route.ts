import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import * as musicMetadata from "music-metadata";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { uploadToStorage } from "@/lib/storage";

// Handle client upload token request (for Vercel Blob client uploads)
export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // Handle multipart form data (direct upload through API)
    if (contentType.includes("multipart/form-data")) {
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

      // Upload to Vercel Blob (private store)
      const filename = `tracks/${randomUUID()}.mp3`;
      const blob = await put(filename, buffer, {
        contentType: "audio/mpeg",
        addRandomSuffix: false,
      });

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
        const coverFilename = `covers/${randomUUID()}.${picture.format === "image/png" ? "png" : "jpg"}`;
        coverUrl = await uploadToStorage(coverFilename, Buffer.from(picture.data), picture.format);

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
          storageKey: blob.url, // Store the full Vercel Blob URL
          fileSize: buffer.length,
        },
        include: {
          artist: true,
          album: true,
        },
      });

      return NextResponse.json(track);
    }

    // Handle JSON request for client upload token
    const body = await request.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 });
    }

    // Return upload instructions for client
    return NextResponse.json({
      uploadEndpoint: "/api/tracks/upload/blob",
      filename: `tracks/${randomUUID()}.mp3`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
