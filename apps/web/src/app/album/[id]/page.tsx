"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Album, Artist, Track } from "@/lib/types";
import { TrackList } from "@/components/shared/track-list";
import { usePlayerStore } from "@/stores/player-store";
import { Disc3, Play, Trash2, Upload, ImagePlus } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface AlbumDetail extends Album {
  artist: Artist;
  tracks: Track[];
}

export default function AlbumPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [album, setAlbum] = useState<AlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { play } = usePlayerStore();

  const loadAlbum = useCallback(async () => {
    try {
      const data = await api.get<AlbumDetail>(`/library/albums/${id}`);
      setAlbum(data);
    } catch (err) {
      console.error("Failed to load album", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  const handleDeleteAlbum = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.deleteAlbum(id);
      router.push("/library?tab=albums");
    } catch (err) {
      console.error("Failed to delete album", err);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const updated = await api.uploadAlbumCover<AlbumDetail>(id, file);
      setAlbum((prev) => prev ? { ...prev, coverUrl: updated.coverUrl } : null);
    } catch (err) {
      console.error("Failed to upload cover", err);
    } finally {
      setUploading(false);
    }
  };

  if (loading || !album) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const totalDuration = album.tracks.reduce((sum, t) => sum + t.duration, 0);
  const minutes = Math.floor(totalDuration / 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end gap-6">
        <div className="relative group">
          {album.coverUrl ? (
            <img
              src={getImageUrl(album.coverUrl)}
              alt={album.name}
              className="w-48 h-48 rounded-md object-cover shadow-lg"
            />
          ) : (
            <div className="w-48 h-48 rounded-md bg-secondary flex items-center justify-center shadow-lg">
              <Disc3 className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-md bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImagePlus className="w-8 h-8 text-white" />
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Album
          </p>
          <h1 className="text-4xl font-bold mt-1">{album.name}</h1>
          <p className="text-muted-foreground text-sm mt-2">
            {album.artist.name} · {album.year || ""} · {album.tracks.length}{" "}
            tracks, {minutes} min
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            if (album.tracks.length > 0) {
              play(album.tracks[0], album.tracks);
            }
          }}
          className="w-12 h-12 rounded-full bg-primary flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
        </button>
        <button
          onClick={() => coverInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Change cover"}
        </button>
        <button
          onClick={handleDeleteAlbum}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            confirmDelete
              ? "bg-red-500/20 text-red-400"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {confirmDelete ? "Click again to confirm" : "Delete album"}
        </button>
      </div>

      {/* Tracks */}
      <TrackList
        tracks={album.tracks}
        showAlbum={false}
        showIndex
        onTrackDeleted={loadAlbum}
      />
    </div>
  );
}
