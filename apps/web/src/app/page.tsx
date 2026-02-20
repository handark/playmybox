"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Track, Playlist } from "@/lib/types";
import { TrackList } from "@/components/shared/track-list";
import { PlaylistCard } from "@/components/shared/playlist-card";

export default function HomePage() {
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [tracks, pls] = await Promise.all([
        api.get<Track[]>("/library/recent"),
        api.get<Playlist[]>("/playlists"),
      ]);
      setRecentTracks(tracks);
      setPlaylists(pls);
    } catch (err) {
      console.error("Failed to load home data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Here's what you've been listening to
        </p>
      </div>

      {/* Playlists */}
      {playlists.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Your Playlists</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
        {recentTracks.length > 0 ? (
          <TrackList tracks={recentTracks} showIndex onTrackDeleted={loadData} />
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No tracks yet. Upload some music to get started!</p>
          </div>
        )}
      </section>
    </div>
  );
}
