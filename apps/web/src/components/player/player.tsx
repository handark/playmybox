"use client";

import { useEffect } from "react";
import { usePlayerStore } from "@/stores/player-store";
import { formatDuration, getImageUrl } from "@/lib/utils";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
} from "lucide-react";

export function Player() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    initAudio,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();

  useEffect(() => {
    initAudio();
  }, [initAudio]);

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border flex items-center justify-center">
        <p className="text-muted-foreground text-sm">
          No track selected
        </p>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-card border-t border-border flex items-center px-4 z-50">
      {/* Track info */}
      <div className="flex items-center gap-3 w-[30%] min-w-0">
        {currentTrack.coverUrl ? (
          <img
            src={getImageUrl(currentTrack.coverUrl)}
            alt={currentTrack.title}
            className="w-14 h-14 rounded object-cover"
          />
        ) : (
          <div className="w-14 h-14 rounded bg-secondary flex items-center justify-center">
            <Volume2 className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {currentTrack.artist.name}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center flex-1 max-w-[40%]">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleShuffle}
            className={`hover:text-foreground transition-colors ${
              shuffle ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          <button
            onClick={previous}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <button
            onClick={next}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={toggleRepeat}
            className={`hover:text-foreground transition-colors ${
              repeat !== "off" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {repeat === "one" ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Seek bar */}
        <div className="flex items-center gap-2 w-full mt-1">
          <span className="text-xs text-muted-foreground w-10 text-right">
            {formatDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="flex-1 h-1 accent-primary"
            style={{
              background: `linear-gradient(to right, var(--color-primary) ${progress}%, var(--color-secondary) ${progress}%)`,
            }}
          />
          <span className="text-xs text-muted-foreground w-10">
            {formatDuration(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-[30%] justify-end">
        <button
          onClick={toggleMute}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-5 h-5" />
          ) : volume < 0.5 ? (
            <Volume1 className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24 h-1 accent-primary"
          style={{
            background: `linear-gradient(to right, var(--color-foreground) ${(isMuted ? 0 : volume) * 100}%, var(--color-secondary) ${(isMuted ? 0 : volume) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
