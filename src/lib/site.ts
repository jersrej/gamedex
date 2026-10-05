import type { Metadata } from "next";

export const SITE_NAME = "GameDex";
export const SITE_TAGLINE = "Find your next game";
export const SITE_DESCRIPTION =
  "A game library for discovering what to play next: browse by genre and platform, dig into screenshots and details, and keep track of what you're playing.";

/** Public origin for absolute metadata URLs. */
export function siteUrl(): URL {
  const configured = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configured) return new URL("http://localhost:3000");
  return new URL(configured.startsWith("http") ? configured : `https://${configured}`);
}

/**
 * Metadata for one page: its own title, description and canonical URL, which
 * is what a search result shows. Pages deliberately set no Open Graph fields
 * of their own, so every shared link — whichever page it points at — shows
 * the same GameDex-branded preview defined in the root layout and
 * `app/opengraph-image.tsx`.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return { title, description, alternates: { canonical: path } };
}
