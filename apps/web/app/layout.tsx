import type { Metadata, Viewport } from "next";
import "@fontsource/comic-neue/latin-400.css";
import "@fontsource/comic-neue/latin-700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dear Hoomin",
  description: "Daily pet thoughts for hoomins.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dear Hoomin",
  },
};

export const viewport: Viewport = {
  themeColor: "#f7c86f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
