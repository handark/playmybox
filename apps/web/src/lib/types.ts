export interface Artist {
  id: string;
  name: string;
  imageUrl: string | null;
  _count?: { tracks: number; albums: number };
}

export interface Album {
  id: string;
  name: string;
  artistId: string;
  artist?: Artist;
  coverUrl: string | null;
  year: number | null;
  _count?: { tracks: number };
}

export interface Track {
  id: string;
  title: string;
  artistId: string;
  artist: Artist;
  albumId: string | null;
  album: Album | null;
  genre: string | null;
  duration: number;
  year: number | null;
  coverUrl: string | null;
  storageKey: string;
  fileSize: number;
  createdAt: string;
  likedAt?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tracks?: PlaylistTrack[];
  _count?: { tracks: number };
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  track: Track;
  order: number;
  addedAt: string;
}
