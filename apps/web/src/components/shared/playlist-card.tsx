"use client";

import Link from "next/link";
import { Playlist } from "@/lib/types";
import { ListMusic } from "lucide-react";

interface PlaylistCardProps {
  playlist: Playlist;
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors"
    >
      {playlist.coverUrl ? (
        <img
          src={playlist.coverUrl}
          alt={playlist.name}
          className="w-full aspect-square rounded-md object-cover mb-3"
        />
      ) : (
        <div className="w-full aspect-square rounded-md bg-secondary flex items-center justify-center mb-3">
          <ListMusic className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <p className="font-medium text-sm truncate">{playlist.name}</p>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {playlist._count?.tracks ?? 0} tracks
      </p>
    </Link>
  );
}
