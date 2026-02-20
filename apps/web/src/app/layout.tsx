import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "./client-layout";

export const metadata: Metadata = {
  title: "PlayMyBox",
  description: "Personal Music Streaming App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
