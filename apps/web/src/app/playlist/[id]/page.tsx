"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Playlist } from "@/lib/types";
import { TrackList } from "@/components/shared/track-list";
import { usePlayerStore } from "@/stores/player-store";
import { ListMusic, Play, Trash2 } from "lucide-react";

export default function PlaylistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { play } = usePlayerStore();

  const loadPlaylist = useCallback(async () => {
    try {
      const data = await api.get<Playlist>(`/playlists/${id}`);
      setPlaylist(data);
    } catch (err) {
      console.error("Failed to load playlist", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const handleDeletePlaylist = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.delete(`/playlists/${id}`);
      router.push("/");
    } catch (err) {
      console.error("Failed to delete playlist", err);
    }
  };

  if (loading || !playlist) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const tracks = playlist.tracks?.map((pt) => pt.track) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end gap-6">
        {playlist.coverUrl ? (
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-48 h-48 rounded-md object-cover shadow-lg"
          />
        ) : (
          <div className="w-48 h-48 rounded-md bg-secondary flex items-center justify-center shadow-lg">
            <ListMusic className="w-20 h-20 text-muted-foreground" />
          </div>
        )}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Playlist
          </p>
          <h1 className="text-4xl font-bold mt-1">{playlist.name}</h1>
          {playlist.description && (
            <p className="text-muted-foreground text-sm mt-1">
              {playlist.description}
            </p>
          )}
          <p className="text-muted-foreground text-sm mt-2">
            {tracks.length} tracks
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {tracks.length > 0 && (
          <button
            onClick={() => play(tracks[0], tracks)}
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </button>
        )}
        <button
          onClick={handleDeletePlaylist}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            confirmDelete
              ? "bg-red-500/20 text-red-400"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {confirmDelete ? "Click again to confirm" : "Delete playlist"}
        </button>
      </div>

      {/* Tracks */}
      {tracks.length > 0 ? (
        <TrackList
          tracks={tracks}
          showIndex
          playlistId={id}
          onTrackRemoved={loadPlaylist}
          onTrackDeleted={loadPlaylist}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>This playlist is empty. Right-click any track to add it!</p>
        </div>
      )}
    </div>
  );
}
