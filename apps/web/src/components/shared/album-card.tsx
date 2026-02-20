"use client";

import Link from "next/link";
import { Album } from "@/lib/types";
import { Disc3 } from "lucide-react";

interface AlbumCardProps {
  album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/album/${album.id}`}
      className="group p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors"
    >
      {album.coverUrl ? (
        <img
          src={album.coverUrl}
          alt={album.name}
          className="w-full aspect-square rounded-md object-cover mb-3"
        />
      ) : (
        <div className="w-full aspect-square rounded-md bg-secondary flex items-center justify-center mb-3">
          <Disc3 className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <p className="font-medium text-sm truncate">{album.name}</p>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {album.artist?.name} {album.year ? `· ${album.year}` : ""}
      </p>
    </Link>
  );
}
