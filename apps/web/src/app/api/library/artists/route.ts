import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const artists = await prisma.artist.findMany({
      include: {
        _count: { select: { tracks: true, albums: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(artists);
  } catch (error) {
    console.error("Get artists error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
