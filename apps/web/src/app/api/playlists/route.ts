import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { createPlaylistSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      include: {
        _count: { select: { tracks: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error("Get playlists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createPlaylistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const playlist = await prisma.playlist.create({
      data: {
        ...result.data,
        userId: user.id,
      },
      include: {
        tracks: {
          include: { track: { include: { artist: true, album: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Create playlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
