export const SITE_NAME = "GameDex";
export const SITE_DESCRIPTION =
  "A game library for discovering what to play next: browse by genre and platform, dig into screenshots and details, and keep track of what you're playing.";

/** Public origin for absolute metadata URLs. */
export function siteUrl(): URL {
  const configured = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!configured) return new URL("http://localhost:3000");
  return new URL(configured.startsWith("http") ? configured : `https://${configured}`);
}
