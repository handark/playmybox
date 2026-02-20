"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Artist, Album, Track } from "@/lib/types";
import { TrackList } from "@/components/shared/track-list";
import { AlbumCard } from "@/components/shared/album-card";
import { User } from "lucide-react";

interface ArtistDetail extends Artist {
  albums: Album[];
  tracks: Track[];
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const loadArtist = useCallback(async () => {
    try {
      const data = await api.get<ArtistDetail>(`/library/artists/${id}`);
      setArtist(data);
    } catch (err) {
      console.error("Failed to load artist", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadArtist();
  }, [loadArtist]);

  if (loading || !artist) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end gap-6">
        {artist.imageUrl ? (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="w-48 h-48 rounded-full object-cover shadow-lg"
          />
        ) : (
          <div className="w-48 h-48 rounded-full bg-secondary flex items-center justify-center shadow-lg">
            <User className="w-20 h-20 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Artist
          </p>
          <h1 className="text-4xl font-bold mt-1">{artist.name}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {artist.albums.length} albums · {artist.tracks.length} tracks
          </p>
        </div>
      </div>

      {/* Albums */}
      {artist.albums.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Albums</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {artist.albums.map((album) => (
              <AlbumCard key={album.id} album={{ ...album, artist }} />
            ))}
          </div>
        </section>
      )}

      {/* All Tracks */}
      <section>
        <h2 className="text-lg font-semibold mb-4">All Tracks</h2>
        <TrackList tracks={artist.tracks} showIndex onTrackDeleted={loadArtist} />
      </section>
    </div>
  );
}
