import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import {
  InstallPrompt,
} from "@/components/pwa/install-prompt";

export const metadata: Metadata = {
  title: {
    default: "ASDRO Tennis",
    template: "%s | ASDRO Tennis",
  },

  description:
    "Application de réservation des terrains de tennis de l'ASDRO.",

  applicationName:
    "ASDRO Tennis",

  manifest:
    "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],

    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "ASDRO Tennis",
    statusBarStyle:
      "black-translucent",
  },

  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",

  themeColor:
    "#07110c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        {children}

        <InstallPrompt />
      </body>
    </html>
  );
}