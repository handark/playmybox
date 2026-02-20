# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlayMyBox is a personal music streaming application built with Next.js. It allows users to upload, organize, and stream their music collection with a Spotify-like interface.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Frontend**: React 19, TypeScript, Tailwind CSS, Zustand
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma with Neon adapter
- **Storage**: Cloudflare R2
- **Auth**: JWT with jose library
- **Deployment**: Vercel

## Common Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Database operations
pnpm db:migrate    # Run Prisma migrations (development)
pnpm db:push       # Push schema to database (production)
pnpm db:generate   # Generate Prisma client
pnpm db:studio     # Open Prisma Studio
```

## Architecture

### API Routes (`src/app/api/`)

All API routes are under `/api` prefix:

- **Auth** (`/api/auth/`) - JWT authentication
  - `POST /register` - Create account
  - `POST /login` - Get JWT token
  - `GET /me` - Get current user (protected)

- **Tracks** (`/api/tracks/`) - Music file management
  - `GET /` - List/search tracks
  - `GET /:id` - Get track details
  - `PATCH /:id` - Update track
  - `DELETE /:id` - Delete track
  - `GET /:id/stream` - Stream audio (public)
  - `POST /upload/presign` - Get presigned URL for R2
  - `POST /upload/complete` - Finalize upload

- **Playlists** (`/api/playlists/`) - User playlists
  - Full CRUD + track management

- **Library** (`/api/library/`) - Aggregated views
  - Artists, albums, liked tracks, recent

### Core Libraries (`src/lib/`)

- `prisma.ts` - Prisma client with Neon adapter
- `auth.ts` - JWT utilities (sign, verify, getAuthUser)
- `storage.ts` - Cloudflare R2 operations
- `validations.ts` - Zod schemas for request validation
- `api.ts` - Frontend API client

### State Management

- `stores/player-store.ts` - Audio playback, queue, MediaSession
- `stores/auth-store.ts` - Authentication state

### Data Model

See `prisma/schema.prisma` for entities: User, Artist, Album, Track, Playlist, PlaylistTrack, LikedTrack.

## File Upload Flow

Uses presigned URLs to bypass Vercel's body size limits:

1. Client requests presigned URL from `/api/tracks/upload/presign`
2. Client uploads directly to R2 using presigned URL
3. Client calls `/api/tracks/upload/complete` to parse metadata and create DB record

## Environment Variables

Required for production (set in Vercel):
- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Random secret for JWT signing
- `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` - R2 configuration
- `CLOUDFLARE_API_TOKEN` - R2 API access
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` - For presigned URLs (optional)

## Deployment

Deploy to Vercel:
1. Connect GitHub repository
2. Add environment variables
3. Deploy

Database: Use Neon PostgreSQL from Vercel Marketplace.
