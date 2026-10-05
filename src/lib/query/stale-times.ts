/**
 * Browser-side freshness (ms) — the second cache layer, in front of the BFF.
 * Kept at or below the matching server lifetime in `server/cache.ts`: there is
 * no point asking the BFF again while it would answer from its own cache.
 */
const MINUTE = 60_000;

export const STALE = {
  taxonomy: 60 * MINUTE,
  game: 30 * MINUTE,
  shelf: 10 * MINUTE,
  list: 5 * MINUTE,
  search: 2 * MINUTE,
} as const;
