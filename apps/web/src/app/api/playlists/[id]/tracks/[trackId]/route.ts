import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string; trackId: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: playlistId, trackId } = await context.params;

    await prisma.playlistTrack.deleteMany({
      where: { playlistId, trackId },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Remove track from playlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
