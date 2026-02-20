import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { deleteFromR2 } from "@/lib/storage";
import { updateTrackSchema } from "@/lib/validations";

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

    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artist: true,
        album: true,
      },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (error) {
    console.error("Get track error:", error);
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

    const result = updateTrackSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await prisma.track.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const track = await prisma.track.update({
      where: { id },
      data: result.data,
      include: {
        artist: true,
        album: true,
      },
    });

    return NextResponse.json(track);
  } catch (error) {
    console.error("Update track error:", error);
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

    const track = await prisma.track.findUnique({ where: { id } });
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Delete from R2
    await deleteFromR2(track.storageKey).catch(() => {});
    if (track.coverUrl) {
      const coverKey = track.coverUrl.split("/").slice(-2).join("/");
      await deleteFromR2(coverKey).catch(() => {});
    }

    // Delete from database
    await prisma.track.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Delete track error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
