"use client";

import { create } from "zustand";
import { Track } from "@/lib/types";
import { getApiUrl } from "@/lib/utils";

interface PlayerState {
  // Current state
  currentTrack: Track | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;

  // Queue
  queue: Track[];
  queueIndex: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";

  // Audio element ref
  audio: HTMLAudioElement | null;

  // Actions
  initAudio: () => void;
  play: (track: Track, trackList?: Track[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  addToQueue: (track: Track) => void;
  clearQueue: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  duration: 0,
  currentTime: 0,
  volume: 1,
  isMuted: false,
  queue: [],
  queueIndex: -1,
  shuffle: false,
  repeat: "off",
  audio: null,

  initAudio: () => {
    if (typeof window === "undefined") return;
    if (get().audio) return;

    const audio = new Audio();
    audio.preload = "auto";

    audio.addEventListener("timeupdate", () => {
      set({ currentTime: audio.currentTime });
    });

    audio.addEventListener("loadedmetadata", () => {
      set({ duration: audio.duration });
    });

    audio.addEventListener("ended", () => {
      get().next();
    });

    audio.addEventListener("play", () => set({ isPlaying: true }));
    audio.addEventListener("pause", () => set({ isPlaying: false }));

    set({ audio });
  },

  play: (track: Track, trackList?: Track[]) => {
    const { audio } = get();
    if (!audio) return;

    const apiUrl = getApiUrl();
    audio.src = `${apiUrl}/tracks/${track.id}/stream`;
    audio.play();

    if (trackList) {
      const index = trackList.findIndex((t) => t.id === track.id);
      set({
        currentTrack: track,
        queue: trackList,
        queueIndex: index >= 0 ? index : 0,
      });
    } else {
      set({ currentTrack: track });
    }

    // MediaSession API
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist.name,
        album: track.album?.name || "",
        artwork: track.coverUrl
          ? [{ src: track.coverUrl, sizes: "512x512", type: "image/jpeg" }]
          : [],
      });

      navigator.mediaSession.setActionHandler("play", () => get().resume());
      navigator.mediaSession.setActionHandler("pause", () => get().pause());
      navigator.mediaSession.setActionHandler("previoustrack", () =>
        get().previous(),
      );
      navigator.mediaSession.setActionHandler("nexttrack", () => get().next());
    }
  },

  togglePlay: () => {
    const { audio, isPlaying } = get();
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  },

  pause: () => {
    get().audio?.pause();
  },

  resume: () => {
    get().audio?.play();
  },

  next: () => {
    const { queue, queueIndex, shuffle, repeat } = get();
    if (queue.length === 0) return;

    let nextIndex: number;

    if (repeat === "one") {
      const { audio } = get();
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }

    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === "all") {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    get().play(queue[nextIndex], queue);
  },

  previous: () => {
    const { audio, queue, queueIndex } = get();
    if (!audio) return;

    // If more than 3 seconds in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    if (queue.length === 0) return;
    const prevIndex = queueIndex - 1 >= 0 ? queueIndex - 1 : queue.length - 1;
    get().play(queue[prevIndex], queue);
  },

  seek: (time: number) => {
    const { audio } = get();
    if (audio) {
      audio.currentTime = time;
    }
  },

  setVolume: (volume: number) => {
    const { audio } = get();
    if (audio) {
      audio.volume = volume;
    }
    set({ volume, isMuted: volume === 0 });
  },

  toggleMute: () => {
    const { audio, isMuted, volume } = get();
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 1;
      set({ isMuted: false });
    } else {
      audio.volume = 0;
      set({ isMuted: true });
    }
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: ("off" | "all" | "one")[] = ["off", "all", "one"];
      const current = modes.indexOf(state.repeat);
      return { repeat: modes[(current + 1) % modes.length] };
    });
  },

  addToQueue: (track: Track) => {
    set((state) => ({ queue: [...state.queue, track] }));
  },

  clearQueue: () => {
    set({ queue: [], queueIndex: -1 });
  },

  setCurrentTime: (time: number) => set({ currentTime: time }),
  setDuration: (duration: number) => set({ duration }),
}));
