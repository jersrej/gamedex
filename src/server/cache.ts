/**
 * Server-side cache lifetimes (seconds) for upstream responses.
 *
 * Layer 1 — Next.js data cache (these values): shared by every visitor and
 * the main thing keeping us inside the provider's monthly request budget.
 * Layer 2 — TanStack Query in the browser (see `lib/query/stale-times.ts`):
 * per visitor, makes back/forward and repeat views instant.
 *
 * Lifetimes follow how often the data really changes, not a blanket TTL.
 */
export const REVALIDATE = {
  /** Genres and platform families change a few times a decade. */
  taxonomy: 60 * 60 * 24,
  /** A released game's metadata and screenshots are close to immutable. */
  game: 60 * 60 * 6,
  /** Popular / new / upcoming shelves drift slowly through the day. */
  shelf: 60 * 60,
  /** Filtered browsing: many distinct keys, moderate lifetime. */
  list: 60 * 15,
  /** Free-text search: effectively unbounded keys, so keep entries short-lived. */
  search: 60 * 5,
} as const;

/** `Cache-Control` for a BFF response, so a CDN can absorb repeat traffic too. */
export function cacheControl(seconds: number): string {
  return `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`;
}
