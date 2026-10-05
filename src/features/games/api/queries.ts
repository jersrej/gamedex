import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import { serializeGameFilters } from "@/lib/games/filters";
import { STALE } from "@/lib/query/stale-times";
import type {
  GameDetail,
  GameFilters,
  GameSummary,
  Paginated,
  Screenshot,
} from "@/types/game";

export type ShelfName = "popular" | "recent" | "upcoming";

export const SEARCH_MIN_LENGTH = 2;
const SEARCH_RESULTS = 6;

/**
 * Query definitions for games. Keys and fetchers live together so a hook, a
 * prefetch and a server-side hydration all agree on what a query is.
 */
export const gameQueries = {
  all: ["games"] as const,

  list: (filters: GameFilters) =>
    queryOptions({
      queryKey: [...gameQueries.all, "list", filters] as const,
      queryFn: ({ signal }) =>
        apiGet<Paginated<GameSummary>>("/api/games", {
          params: serializeGameFilters(filters),
          signal,
        }),
      staleTime: filters.q ? STALE.search : STALE.list,
      // Keep the current page on screen while the next one loads.
      placeholderData: keepPreviousData,
    }),

  search: (term: string) =>
    queryOptions({
      queryKey: [...gameQueries.all, "search", term] as const,
      queryFn: ({ signal }) =>
        apiGet<Paginated<GameSummary>>("/api/games", {
          params: new URLSearchParams({ q: term, pageSize: String(SEARCH_RESULTS) }),
          signal,
        }),
      enabled: term.length >= SEARCH_MIN_LENGTH,
      staleTime: STALE.search,
      placeholderData: keepPreviousData,
    }),

  /** Home-page shelves: fixed, curated lists with no parameters. */
  shelf: (name: ShelfName) =>
    queryOptions({
      queryKey: [...gameQueries.all, "shelf", name] as const,
      queryFn: ({ signal }) => apiGet<GameSummary[]>(`/api/games/${name}`, { signal }),
      staleTime: STALE.shelf,
    }),

  popular: () => gameQueries.shelf("popular"),
  recent: () => gameQueries.shelf("recent"),
  upcoming: () => gameQueries.shelf("upcoming"),

  detail: (slug: string) =>
    queryOptions({
      queryKey: [...gameQueries.all, "detail", slug] as const,
      queryFn: ({ signal }) => apiGet<GameDetail>(`/api/games/${slug}`, { signal }),
      staleTime: STALE.game,
    }),

  screenshots: (slug: string) =>
    queryOptions({
      queryKey: [...gameQueries.all, "detail", slug, "screenshots"] as const,
      queryFn: ({ signal }) =>
        apiGet<Screenshot[]>(`/api/games/${slug}/screenshots`, { signal }),
      staleTime: STALE.game,
    }),

  series: (slug: string) =>
    queryOptions({
      queryKey: [...gameQueries.all, "detail", slug, "series"] as const,
      queryFn: ({ signal }) =>
        apiGet<GameSummary[]>(`/api/games/${slug}/series`, { signal }),
      staleTime: STALE.game,
    }),
};

export function fetchRandomGame(): Promise<GameSummary> {
  return apiGet<GameSummary>("/api/games/random");
}
