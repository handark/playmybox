import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { deleteFromStorage, uploadToStorage } from "@/lib/storage";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        artist: true,
        tracks: {
          include: { artist: true },
          orderBy: { title: "asc" },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    return NextResponse.json(album);
  } catch (error) {
    console.error("Get album error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Upload album cover
export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const album = await prisma.album.findUnique({ where: { id } });
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("cover") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No cover image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old cover if exists
    if (album.coverUrl) {
      await deleteFromStorage(album.coverUrl).catch(() => {});
    }

    // Upload new cover
    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `covers/${randomUUID()}.${ext}`;
    const coverUrl = await uploadToStorage(filename, buffer, file.type);

    // Update album
    const updatedAlbum = await prisma.album.update({
      where: { id },
      data: { coverUrl },
      include: { artist: true },
    });

    return NextResponse.json(updatedAlbum);
  } catch (error) {
    console.error("Update album cover error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const album = await prisma.album.findUnique({
      where: { id },
      include: { tracks: true },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Delete all tracks' files from Vercel Blob
    for (const track of album.tracks) {
      await deleteFromStorage(track.storageKey).catch(() => {});
      if (track.coverUrl) {
        await deleteFromStorage(track.coverUrl).catch(() => {});
      }
    }

    // Delete all tracks (cascade deletes playlist_tracks and liked_tracks)
    await prisma.track.deleteMany({ where: { albumId: id } });

    // Delete album cover from Vercel Blob
    if (album.coverUrl) {
      await deleteFromStorage(album.coverUrl).catch(() => {});
    }

    // Delete the album
    await prisma.album.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete album error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
