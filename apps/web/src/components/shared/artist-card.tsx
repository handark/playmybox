"use client";

import Link from "next/link";
import { Artist } from "@/lib/types";
import { User } from "lucide-react";

interface ArtistCardProps {
  artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group p-4 rounded-lg bg-card hover:bg-accent/50 transition-colors"
    >
      {artist.imageUrl ? (
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="w-full aspect-square rounded-full object-cover mb-3"
        />
      ) : (
        <div className="w-full aspect-square rounded-full bg-secondary flex items-center justify-center mb-3">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <p className="font-medium text-sm truncate text-center">{artist.name}</p>
      <p className="text-xs text-muted-foreground text-center mt-1">Artist</p>
    </Link>
  );
}
