"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

import { parseGameFilters, serializeGameFilters } from "@/lib/games/filters";
import type { GameFilters } from "@/types/game";

/** Filters pinned by the route itself, e.g. the genre on `/genres/rpg`. */
export type LockedFilters = Pick<GameFilters, "genre" | "platform">;

/**
 * The URL is the single source of truth for discovery filters, which makes
 * every filtered view shareable and back/forward-friendly.
 */
export function useGameFilters(locked: LockedFilters = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo<GameFilters>(
    () => ({ ...parseGameFilters(searchParams).filters, ...locked }),
    // `locked` is a fresh object each render; depend on its values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, locked.genre, locked.platform],
  );

  const hrefFor = useCallback(
    (next: GameFilters) => {
      const params = serializeGameFilters(next);
      // Locked filters live in the path, not the query string.
      if (locked.genre) params.delete("genre");
      if (locked.platform) params.delete("platform");
      const query = params.toString();
      return query ? `${pathname}?${query}` : pathname;
    },
    [pathname, locked.genre, locked.platform],
  );

  const setFilters = useCallback(
    (change: Partial<GameFilters>, options: { replace?: boolean } = {}) => {
      // Any change to what is being listed starts again from the first page.
      const href = hrefFor({ ...filters, page: 1, ...change });
      if (options.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [filters, hrefFor, router],
  );

  return { filters, setFilters, hrefFor };
}
