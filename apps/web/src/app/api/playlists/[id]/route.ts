import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { updatePlaylistSchema } from "@/lib/validations";

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

    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        tracks: {
          include: { track: { include: { artist: true, album: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Get playlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const result = updatePlaylistSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    const playlist = await prisma.playlist.update({
      where: { id },
      data: result.data,
      include: {
        tracks: {
          include: { track: { include: { artist: true, album: true } } },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(playlist);
  } catch (error) {
    console.error("Update playlist error:", error);
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

    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    await prisma.playlist.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete playlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
