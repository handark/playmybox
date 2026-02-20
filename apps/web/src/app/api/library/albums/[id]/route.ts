import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { deleteFromR2 } from "@/lib/storage";

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

    // Delete all tracks' files from R2
    for (const track of album.tracks) {
      await deleteFromR2(track.storageKey).catch(() => {});
      if (track.coverUrl) {
        const coverKey = track.coverUrl.split("/").slice(-2).join("/");
        await deleteFromR2(coverKey).catch(() => {});
      }
    }

    // Delete all tracks (cascade deletes playlist_tracks and liked_tracks)
    await prisma.track.deleteMany({ where: { albumId: id } });

    // Delete album cover from R2
    if (album.coverUrl) {
      const coverKey = album.coverUrl.split("/").slice(-2).join("/");
      await deleteFromR2(coverKey).catch(() => {});
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
