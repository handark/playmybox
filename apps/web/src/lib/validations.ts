import { z } from "zod";

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Track schemas
export const searchTracksSchema = z.object({
  q: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional(),
  genre: z.string().optional(),
});

export const updateTrackSchema = z.object({
  title: z.string().optional(),
  genre: z.string().optional(),
});

export const presignUploadSchema = z.object({
  filename: z.string(),
  contentType: z.string().optional(),
});

export const completeUploadSchema = z.object({
  key: z.string(),
  filename: z.string(),
});

// Playlist schemas
export const createPlaylistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});

export const addTrackToPlaylistSchema = z.object({
  trackId: z.string(),
});

export const reorderTracksSchema = z.object({
  trackIds: z.array(z.string()),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SearchTracksInput = z.infer<typeof searchTracksSchema>;
export type UpdateTrackInput = z.infer<typeof updateTrackSchema>;
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddTrackToPlaylistInput = z.infer<typeof addTrackToPlaylistSchema>;
export type ReorderTracksInput = z.infer<typeof reorderTracksSchema>;
