import {
  FIRST_RELEASE_YEAR,
  GAME_SORTS,
  MAX_SEARCH_LENGTH,
  MIN_SCORES,
  type GameFilters,
  type GameSort,
  type MinScore,
} from "@/types/game";

/**
 * One parser for the filter query language, used on both sides of the BFF:
 * pages use it leniently (bad values fall back to defaults so a mangled link
 * still renders), the API uses `invalid` to reject the request outright.
 */

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const MAX_PAGE = 500;

export const DEFAULT_FILTERS: GameFilters = { sort: "relevance", page: 1 };

export function isSlug(value: string): boolean {
  return value.length <= 100 && SLUG.test(value);
}

export function maxReleaseYear(now = new Date()): number {
  return now.getUTCFullYear() + 2;
}

function toInteger(value: string): number | null {
  return /^\d{1,6}$/.test(value) ? Number(value) : null;
}

type Reader = { get(name: string): string | null };

export function parseGameFilters(params: Reader): {
  filters: GameFilters;
  invalid: string[];
} {
  const filters: GameFilters = { ...DEFAULT_FILTERS };
  const invalid: string[] = [];

  const q = params.get("q")?.trim().replace(/\s+/g, " ");
  if (q) {
    if (q.length <= MAX_SEARCH_LENGTH) filters.q = q;
    else invalid.push("q");
  }

  for (const name of ["genre", "platform"] as const) {
    const value = params.get(name);
    if (!value) continue;
    if (isSlug(value)) filters[name] = value;
    else invalid.push(name);
  }

  const year = params.get("year");
  if (year) {
    const parsed = toInteger(year);
    if (parsed !== null && parsed >= FIRST_RELEASE_YEAR && parsed <= maxReleaseYear()) {
      filters.year = parsed;
    } else invalid.push("year");
  }

  const score = params.get("score");
  if (score) {
    const parsed = toInteger(score);
    if (parsed !== null && (MIN_SCORES as readonly number[]).includes(parsed)) {
      filters.score = parsed as MinScore;
    } else invalid.push("score");
  }

  const sort = params.get("sort");
  if (sort) {
    if ((GAME_SORTS as readonly string[]).includes(sort)) filters.sort = sort as GameSort;
    else invalid.push("sort");
  }

  const page = params.get("page");
  if (page) {
    const parsed = toInteger(page);
    if (parsed !== null && parsed >= 1 && parsed <= MAX_PAGE) filters.page = parsed;
    else invalid.push("page");
  }

  return { filters, invalid };
}

/** Serialises filters, leaving defaults out so URLs stay short and canonical. */
export function serializeGameFilters(filters: GameFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.genre) params.set("genre", filters.genre);
  if (filters.platform) params.set("platform", filters.platform);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.score) params.set("score", String(filters.score));
  if (filters.sort !== DEFAULT_FILTERS.sort) params.set("sort", filters.sort);
  if (filters.page > 1) params.set("page", String(filters.page));
  return params;
}

export function countActiveFilters(filters: GameFilters): number {
  return [filters.genre, filters.platform, filters.year, filters.score].filter(Boolean)
    .length;
}
