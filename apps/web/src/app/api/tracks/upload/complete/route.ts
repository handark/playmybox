import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import * as musicMetadata from "music-metadata";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadToR2, getPublicUrl, getR2PublicUrl } from "@/lib/storage";
import { completeUploadSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = completeUploadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { key, filename } = result.data;

    // Fetch the uploaded file from R2 to parse metadata
    const publicUrl = `${getR2PublicUrl()}/${key}`;
    const response = await fetch(publicUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch uploaded file" },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileSize = buffer.length;

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
        title: common.title || filename.replace(/\.mp3$/i, ""),
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
    console.error("Complete upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
