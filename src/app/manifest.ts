import type { MetadataRoute } from "next";

/**
 * Minimal, correct PWA manifest: just enough to be installable
 * (name, icons, start_url, standalone display). No service worker and no
 * offline/caching story yet — that's explicitly a later step.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RUBIKO",
    short_name: "RUBIKO",
    description:
      "Entrenador de speedcubing para 3×3: practica CFOP (Cross, F2L, OLL, PLL) paso a paso.",
    start_url: "/",
    display: "standalone",
    background_color: "#12141c",
    theme_color: "#12141c",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
