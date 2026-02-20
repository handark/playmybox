import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const albums = await prisma.album.findMany({
      include: {
        artist: true,
        _count: { select: { tracks: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(albums);
  } catch (error) {
    console.error("Get albums error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
