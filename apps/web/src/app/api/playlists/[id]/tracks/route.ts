import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { addTrackToPlaylistSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: playlistId } = await context.params;
    const body = await request.json();

    const result = addTrackToPlaylistSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { trackId } = result.data;

    // Verify playlist exists
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Get max order
    const maxOrder = await prisma.playlistTrack.aggregate({
      where: { playlistId },
      _max: { order: true },
    });

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { track: { include: { artist: true, album: true } } },
    });

    return NextResponse.json(playlistTrack);
  } catch (error) {
    console.error("Add track to playlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
