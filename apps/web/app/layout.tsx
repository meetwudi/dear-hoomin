import type { Metadata, Viewport } from "next";
import { getSession } from "../lib/auth/session";
import { PushNotificationBootstrap } from "./components/push-notification-bootstrap";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dear Hoomin",
  description: "Daily pet thoughts for hoomins.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f7c86f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body>
        {children}
        <PushNotificationBootstrap isSignedIn={Boolean(session)} />
      </body>
    </html>
  );
}
