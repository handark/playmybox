"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Artist, Album, Track } from "@/lib/types";
import { TrackList } from "@/components/shared/track-list";
import { AlbumCard } from "@/components/shared/album-card";
import { User, Trash2, Upload, ImagePlus } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface ArtistDetail extends Artist {
  albums: Album[];
  tracks: Track[];
}

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

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

  const handleDeleteArtist = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.deleteArtist(id);
      router.push("/library?tab=artists");
    } catch (err) {
      console.error("Failed to delete artist", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const updated = await api.uploadArtistImage<Artist>(id, file);
      setArtist((prev) => prev ? { ...prev, imageUrl: updated.imageUrl } : null);
    } catch (err) {
      console.error("Failed to upload image", err);
    } finally {
      setUploading(false);
    }
  };

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
        <div className="relative group">
          {artist.imageUrl ? (
            <img
              src={getImageUrl(artist.imageUrl)}
              alt={artist.name}
              className="w-48 h-48 rounded-full object-cover shadow-lg"
            />
          ) : (
            <div className="w-48 h-48 rounded-full bg-secondary flex items-center justify-center shadow-lg">
              <User className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ImagePlus className="w-8 h-8 text-white" />
            )}
          </button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
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

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Change image"}
        </button>
        <button
          onClick={handleDeleteArtist}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
            confirmDelete
              ? "bg-red-500/20 text-red-400"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Trash2 className="w-4 h-4" />
          {confirmDelete ? "Click again to confirm" : "Delete artist"}
        </button>
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
