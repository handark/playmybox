import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { searchTracksSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = {
      q: searchParams.get("q") || undefined,
      artist: searchParams.get("artist") || undefined,
      album: searchParams.get("album") || undefined,
      genre: searchParams.get("genre") || undefined,
    };

    const result = searchTracksSchema.safeParse(query);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = {};

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: "insensitive" } },
        { artist: { name: { contains: query.q, mode: "insensitive" } } },
        { album: { name: { contains: query.q, mode: "insensitive" } } },
      ];
    }

    if (query.artist) {
      where.artist = { name: { contains: query.artist, mode: "insensitive" } };
    }

    if (query.album) {
      where.album = { name: { contains: query.album, mode: "insensitive" } };
    }

    if (query.genre) {
      where.genre = { contains: query.genre, mode: "insensitive" };
    }

    const tracks = await prisma.track.findMany({
      where,
      include: {
        artist: true,
        album: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Get tracks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
