"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Track, Playlist } from "@/lib/types";
import { usePlayerStore } from "@/stores/player-store";
import {
  ListPlus,
  ListMinus,
  User,
  Disc3,
  ListEnd,
  Trash2,
  ChevronRight,
  Plus,
} from "lucide-react";

interface TrackContextMenuProps {
  track: Track;
  x: number;
  y: number;
  onClose: () => void;
  playlistId?: string;
  onTrackRemoved?: () => void;
  onTrackDeleted?: () => void;
  onCreatePlaylist?: () => void;
}

export function TrackContextMenu({
  track,
  x,
  y,
  onClose,
  playlistId,
  onTrackRemoved,
  onTrackDeleted,
  onCreatePlaylist,
}: TrackContextMenuProps) {
  const router = useRouter();
  const { addToQueue } = usePlayerStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuPos, setMenuPos] = useState({ x, y });

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newX = x + rect.width > window.innerWidth ? x - rect.width : x;
      const newY =
        y + rect.height > window.innerHeight - 80
          ? y - rect.height
          : y;
      setMenuPos({ x: Math.max(0, newX), y: Math.max(0, newY) });
    }
  }, [x, y]);

  // Close on click outside or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Load playlists when submenu opens
  useEffect(() => {
    if (showPlaylists && playlists.length === 0) {
      api.get<Playlist[]>("/playlists").then(setPlaylists).catch(() => {});
    }
  }, [showPlaylists, playlists.length]);

  const handleAddToPlaylist = async (plId: string) => {
    try {
      await api.post(`/playlists/${plId}/tracks`, { trackId: track.id });
    } catch {}
    onClose();
  };

  const handleRemoveFromPlaylist = async () => {
    if (!playlistId) return;
    try {
      await api.delete(`/playlists/${playlistId}/tracks/${track.id}`);
      onTrackRemoved?.();
    } catch {}
    onClose();
  };

  const handleAddToQueue = () => {
    addToQueue(track);
    onClose();
  };

  const handleGoToArtist = () => {
    router.push(`/artist/${track.artistId}`);
    onClose();
  };

  const handleGoToAlbum = () => {
    if (track.albumId) {
      router.push(`/album/${track.albumId}`);
    }
    onClose();
  };

  const handleDeleteTrack = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await api.delete(`/tracks/${track.id}`);
      onTrackDeleted?.();
    } catch {}
    onClose();
  };

  const menuItemClass =
    "flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors text-left";

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[200px]"
      style={{ left: menuPos.x, top: menuPos.y }}
    >
      {/* Add to playlist */}
      <div
        className="relative"
        onMouseEnter={() => setShowPlaylists(true)}
        onMouseLeave={() => setShowPlaylists(false)}
      >
        <button className={menuItemClass}>
          <ListPlus className="w-4 h-4" />
          Add to playlist
          <ChevronRight className="w-4 h-4 ml-auto" />
        </button>

        {showPlaylists && (
          <div className="absolute left-full top-0 ml-1 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px] max-h-64 overflow-y-auto">
            {onCreatePlaylist && (
              <button
                onClick={() => {
                  onCreatePlaylist();
                  onClose();
                }}
                className={menuItemClass}
              >
                <Plus className="w-4 h-4" />
                New playlist
              </button>
            )}
            {playlists.length > 0 && onCreatePlaylist && (
              <div className="border-t border-border my-1" />
            )}
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                className={menuItemClass}
              >
                {pl.name}
              </button>
            ))}
            {playlists.length === 0 && !onCreatePlaylist && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No playlists yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Remove from playlist */}
      {playlistId && (
        <button onClick={handleRemoveFromPlaylist} className={menuItemClass}>
          <ListMinus className="w-4 h-4" />
          Remove from this playlist
        </button>
      )}

      <div className="border-t border-border my-1" />

      {/* Go to artist */}
      <button onClick={handleGoToArtist} className={menuItemClass}>
        <User className="w-4 h-4" />
        Go to artist
      </button>

      {/* Go to album */}
      {track.albumId && (
        <button onClick={handleGoToAlbum} className={menuItemClass}>
          <Disc3 className="w-4 h-4" />
          Go to album
        </button>
      )}

      <div className="border-t border-border my-1" />

      {/* Add to queue */}
      <button onClick={handleAddToQueue} className={menuItemClass}>
        <ListEnd className="w-4 h-4" />
        Add to queue
      </button>

      <div className="border-t border-border my-1" />

      {/* Delete track */}
      <button
        onClick={handleDeleteTrack}
        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors text-left"
      >
        <Trash2 className="w-4 h-4" />
        {confirmDelete ? "Confirm delete?" : "Delete track"}
      </button>
    </div>
  );
}
