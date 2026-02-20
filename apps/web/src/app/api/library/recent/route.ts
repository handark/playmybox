import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tracks = await prisma.track.findMany({
      include: { artist: true, album: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Get recent tracks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
