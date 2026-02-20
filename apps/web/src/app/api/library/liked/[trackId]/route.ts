import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ trackId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { trackId } = await context.params;

    const existing = await prisma.likedTrack.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
    });

    return NextResponse.json({ liked: !!existing });
  } catch (error) {
    console.error("Check liked error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { trackId } = await context.params;

    const existing = await prisma.likedTrack.findUnique({
      where: { userId_trackId: { userId: user.id, trackId } },
    });

    if (existing) {
      // Unlike
      await prisma.likedTrack.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ liked: false });
    }

    // Like
    await prisma.likedTrack.create({
      data: { userId: user.id, trackId },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
