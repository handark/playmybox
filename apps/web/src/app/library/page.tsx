"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Track, Album, Artist } from "@/lib/types";
import { TrackList } from "@/components/shared/track-list";
import { AlbumCard } from "@/components/shared/album-card";
import { ArtistCard } from "@/components/shared/artist-card";

type Tab = "tracks" | "albums" | "artists" | "liked";

export default function LibraryPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "tracks";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      switch (tab) {
        case "tracks":
          setTracks(await api.get<Track[]>("/tracks"));
          break;
        case "albums":
          setAlbums(await api.get<Album[]>("/library/albums"));
          break;
        case "artists":
          setArtists(await api.get<Artist[]>("/library/artists"));
          break;
        case "liked":
          setLikedTracks(await api.get<Track[]>("/library/liked"));
          break;
      }
    } catch (err) {
      console.error("Failed to load library", err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadTab();
  }, [loadTab]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "tracks", label: "Tracks" },
    { key: "albums", label: "Albums" },
    { key: "artists", label: "Artists" },
    { key: "liked", label: "Liked" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Library</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-foreground text-background"
                : "bg-secondary text-foreground hover:bg-accent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <>
          {tab === "tracks" && <TrackList tracks={tracks} showIndex onTrackDeleted={loadTab} />}
          {tab === "albums" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {albums.map((album) => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
          {tab === "artists" && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {artists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          )}
          {tab === "liked" && <TrackList tracks={likedTracks} showIndex onTrackDeleted={loadTab} />}
        </>
      )}
    </div>
  );
}
