import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ASDRO Tennis",
    short_name: "ASDRO",

    description:
      "Application de réservation des terrains de tennis de l'ASDRO.",

    start_url: "/",

    display: "standalone",

    background_color: "#07110c",

    theme_color: "#07110c",

    orientation: "portrait-primary",

    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}