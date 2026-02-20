"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home,
  Library,
  Search,
  Upload,
  Heart,
  LogOut,
  Plus,
  ListMusic,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { Playlist } from "@/lib/types";
import { CreatePlaylistModal } from "./create-playlist-modal";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/upload", label: "Upload", icon: Upload },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    api.get<Playlist[]>("/playlists").then(setPlaylists).catch(() => {});
  }, []);

  const handlePlaylistCreated = (playlist: Playlist) => {
    setPlaylists((prev) => [playlist, ...prev]);
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <>
      <aside className="w-60 bg-card h-full flex flex-col border-r border-border">
        {/* Logo */}
        <div className="p-6">
          <h1 className="text-xl font-bold text-primary">PlayMyBox</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-hidden flex flex-col">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "text-sidebar-active bg-accent"
                        : "text-sidebar-foreground hover:text-sidebar-active hover:bg-accent",
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 pt-6 border-t border-border">
            <Link
              href="/library?tab=liked"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:text-sidebar-active hover:bg-accent transition-colors"
            >
              <Heart className="w-5 h-5" />
              Liked Songs
            </Link>
          </div>

          {/* Playlists section */}
          <div className="mt-4 pt-4 border-t border-border flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Playlists
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Create playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-0.5">
              {playlists.map((pl) => (
                <Link
                  key={pl.id}
                  href={`/playlist/${pl.id}`}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors truncate",
                    pathname === `/playlist/${pl.id}`
                      ? "text-sidebar-active bg-accent"
                      : "text-sidebar-foreground hover:text-sidebar-active hover:bg-accent",
                  )}
                >
                  <ListMusic className="w-4 h-4 shrink-0" />
                  <span className="truncate">{pl.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:text-sidebar-active hover:bg-accent transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      <CreatePlaylistModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePlaylistCreated}
      />
    </>
  );
}
