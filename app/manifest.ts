import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "bentido",
    short_name: "bentido",
    description:
      "Rental agreements, sorted in minutes — verified KYC, e-stamp and e-sign.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d9488",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
