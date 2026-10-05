import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/** Stable entry points only; game pages are discovered by crawling from these. */
export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/games", "/compare"].map((path) => ({
    url: new URL(path, siteUrl()).toString(),
    changeFrequency: "daily",
  }));
}
