import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { uploadToStorage, deleteFromStorage } from "@/lib/storage";

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

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        albums: {
          include: {
            _count: { select: { tracks: true } },
          },
          orderBy: { year: "desc" },
        },
        tracks: {
          include: { artist: true, album: true },
          orderBy: { title: "asc" },
        },
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    return NextResponse.json(artist);
  } catch (error) {
    console.error("Get artist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Upload artist image
export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const artist = await prisma.artist.findUnique({ where: { id } });
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old image if exists
    if (artist.imageUrl) {
      await deleteFromStorage(artist.imageUrl).catch(() => {});
    }

    // Upload new image
    const ext = file.type === "image/png" ? "png" : "jpg";
    const filename = `artists/${randomUUID()}.${ext}`;
    const imageUrl = await uploadToStorage(filename, buffer, file.type);

    // Update artist
    const updatedArtist = await prisma.artist.update({
      where: { id },
      data: { imageUrl },
    });

    return NextResponse.json(updatedArtist);
  } catch (error) {
    console.error("Update artist image error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete artist and all related data
export async function DELETE(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const artist = await prisma.artist.findUnique({
      where: { id },
      include: {
        albums: true,
        tracks: true,
      },
    });

    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    // Delete all track files from storage
    for (const track of artist.tracks) {
      await deleteFromStorage(track.storageKey).catch(() => {});
      if (track.coverUrl) {
        await deleteFromStorage(track.coverUrl).catch(() => {});
      }
    }

    // Delete album covers from storage
    for (const album of artist.albums) {
      if (album.coverUrl) {
        await deleteFromStorage(album.coverUrl).catch(() => {});
      }
    }

    // Delete artist image from storage
    if (artist.imageUrl) {
      await deleteFromStorage(artist.imageUrl).catch(() => {});
    }

    // Delete all tracks (this will cascade delete playlist_tracks and liked_tracks)
    await prisma.track.deleteMany({ where: { artistId: id } });

    // Delete all albums
    await prisma.album.deleteMany({ where: { artistId: id } });

    // Delete the artist
    await prisma.artist.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete artist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
