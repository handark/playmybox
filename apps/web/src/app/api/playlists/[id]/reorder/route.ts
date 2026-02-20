import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { reorderTracksSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: playlistId } = await context.params;
    const body = await request.json();

    const result = reorderTracksSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    // Verify playlist exists
    const existing = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    const { trackIds } = result.data;

    // Update order for each track in transaction
    const updates = trackIds.map((trackId, index) =>
      prisma.playlistTrack.updateMany({
        where: { playlistId, trackId },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    // Return updated playlist
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        tracks: {
          include: { track: { include: { artist: true, album: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Reorder tracks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
