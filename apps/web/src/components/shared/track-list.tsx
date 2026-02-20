"use client";

import { Track } from "@/lib/types";
import { usePlayerStore } from "@/stores/player-store";
import { formatDuration } from "@/lib/utils";
import { Play, Pause, Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useState, useCallback } from "react";
import { TrackContextMenu } from "./track-context-menu";

interface TrackListProps {
  tracks: Track[];
  showAlbum?: boolean;
  showIndex?: boolean;
  playlistId?: string;
  onTrackRemoved?: () => void;
  onTrackDeleted?: () => void;
  onCreatePlaylist?: () => void;
}

export function TrackList({
  tracks,
  showAlbum = true,
  showIndex = false,
  playlistId,
  onTrackRemoved,
  onTrackDeleted,
  onCreatePlaylist,
}: TrackListProps) {
  const { play, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const [contextMenu, setContextMenu] = useState<{
    track: Track;
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, track: Track) => {
      e.preventDefault();
      setContextMenu({ track, x: e.clientX, y: e.clientY });
    },
    [],
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-xs text-muted-foreground border-b border-border">
        <span className="w-8 text-center">#</span>
        <span>Title</span>
        {showAlbum && <span>Album</span>}
        <span className="w-16 text-right">Duration</span>
      </div>

      {/* Tracks */}
      {tracks.map((track, index) => {
        const isCurrent = currentTrack?.id === track.id;
        return (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            isCurrent={isCurrent}
            isPlaying={isCurrent && isPlaying}
            showAlbum={showAlbum}
            showIndex={showIndex}
            onPlay={() => {
              if (isCurrent) {
                togglePlay();
              } else {
                play(track, tracks);
              }
            }}
            onContextMenu={handleContextMenu}
          />
        );
      })}

      {/* Context menu */}
      {contextMenu && (
        <TrackContextMenu
          track={contextMenu.track}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          playlistId={playlistId}
          onTrackRemoved={onTrackRemoved}
          onTrackDeleted={onTrackDeleted}
          onCreatePlaylist={onCreatePlaylist}
        />
      )}
    </div>
  );
}

function TrackRow({
  track,
  index,
  isCurrent,
  isPlaying,
  showAlbum,
  showIndex,
  onPlay,
  onContextMenu,
}: {
  track: Track;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  showAlbum: boolean;
  showIndex: boolean;
  onPlay: () => void;
  onContextMenu: (e: React.MouseEvent, track: Track) => void;
}) {
  const [liked, setLiked] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await api.post<{ liked: boolean }>(
        `/library/liked/${track.id}`,
      );
      setLiked(res.liked);
    } catch {}
  };

  return (
    <div
      onClick={onPlay}
      onContextMenu={(e) => onContextMenu(e, track)}
      className={`grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2 text-sm rounded-md cursor-pointer group transition-colors ${
        isCurrent
          ? "bg-accent text-primary"
          : "hover:bg-accent/50 text-foreground"
      }`}
    >
      {/* Index / Play icon */}
      <div className="w-8 flex items-center justify-center">
        <span className="group-hover:hidden">
          {isCurrent && isPlaying ? (
            <span className="text-primary text-xs">♪</span>
          ) : showIndex ? (
            index + 1
          ) : (
            <span className="text-muted-foreground">{index + 1}</span>
          )}
        </span>
        <span className="hidden group-hover:block">
          {isPlaying && isCurrent ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </span>
      </div>

      {/* Title + Artist */}
      <div className="flex items-center gap-3 min-w-0">
        {track.coverUrl && (
          <img
            src={track.coverUrl}
            alt=""
            className="w-10 h-10 rounded object-cover"
          />
        )}
        <div className="min-w-0">
          <p
            className={`truncate font-medium ${isCurrent ? "text-primary" : ""}`}
          >
            {track.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {track.artist?.name ?? "Unknown Artist"}
          </p>
        </div>
      </div>

      {/* Album */}
      {showAlbum && (
        <div className="flex items-center">
          <span className="text-muted-foreground text-sm truncate">
            {track.album?.name || "\u2014"}
          </span>
        </div>
      )}

      {/* Duration + Actions */}
      <div className="flex items-center gap-2 w-16 justify-end">
        <button
          onClick={handleLike}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
            liked ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
        </button>
        <span className="text-muted-foreground text-xs">
          {formatDuration(track.duration)}
        </span>
      </div>
    </div>
  );
}
