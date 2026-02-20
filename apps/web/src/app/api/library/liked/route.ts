import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const liked = await prisma.likedTrack.findMany({
      where: { userId: user.id },
      include: {
        track: {
          include: { artist: true, album: true },
        },
      },
      orderBy: { likedAt: "desc" },
    });

    // Return tracks with likedAt timestamp
    const tracks = liked.map((l: typeof liked[number]) => ({ ...l.track, likedAt: l.likedAt }));

    return NextResponse.json(tracks);
  } catch (error) {
    console.error("Get liked tracks error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
