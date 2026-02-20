"use client";

import { AuthGate } from "@/components/shared/auth-gate";
import { Sidebar } from "@/components/shared/sidebar";
import { Player } from "@/components/player/player";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pb-24 p-6">{children}</main>
      </div>
      <Player />
    </AuthGate>
  );
}
