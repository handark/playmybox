import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

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
