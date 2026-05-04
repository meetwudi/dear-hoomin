import type { Metadata, Viewport } from "next";
import "@fontsource/comic-neue/latin-400.css";
import "@fontsource/comic-neue/latin-700.css";
import { productCopy } from "../lib/product-copy";
import "./globals.css";

export const metadata: Metadata = {
  title: productCopy.brand.name,
  description: productCopy.brand.description,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: productCopy.brand.name,
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
