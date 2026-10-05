import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // RAWG serves all artwork and screenshots from this host.
    remotePatterns: [
      { protocol: "https", hostname: "media.rawg.io", pathname: "/media/**" },
    ],
    formats: ["image/avif", "image/webp"],
    // Artwork for a given URL never changes, so keep optimised variants for a month.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 640, 828, 1080, 1440, 1920],
    imageSizes: [96, 160, 256, 384],
  },
};

export default nextConfig;
