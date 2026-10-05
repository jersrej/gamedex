import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";

import { GameSelectSkeleton } from "@/components/game/game-select";
import { catalogQueries } from "@/features/catalog/queries";
import { gameQueries } from "@/features/games/api/queries";
import { GameBrowser } from "@/features/games/components/game-browser";
import type { LockedFilters } from "@/features/games/hooks/use-game-filters";
import { parseGameFilters } from "@/lib/games/filters";
import { getQueryClient } from "@/lib/query/client";
import { getGenres, getPlatforms, listGames } from "@/server/games";

export type RawSearchParams = Record<string, string | string[] | undefined>;

function reader(searchParams: RawSearchParams) {
  return {
    get(name: string) {
      const value = searchParams[name];
      return (Array.isArray(value) ? value[0] : value) ?? null;
    },
  };
}

/**
 * Server shell shared by /games, /genres/[slug] and /platforms/[slug]: reads
 * the same filters the client will, prefetches that exact query, and hands the
 * result over through hydration so the first paint already has games.
 */
export async function BrowsePage({
  searchParams,
  locked = {},
}: {
  searchParams: RawSearchParams;
  locked?: LockedFilters;
}) {
  const filters = { ...parseGameFilters(reader(searchParams)).filters, ...locked };
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: gameQueries.list(filters).queryKey,
      queryFn: () => listGames(filters),
    }),
    queryClient.prefetchQuery({
      queryKey: catalogQueries.genres().queryKey,
      queryFn: getGenres,
    }),
    queryClient.prefetchQuery({
      queryKey: catalogQueries.platforms().queryKey,
      queryFn: getPlatforms,
    }),
  ]);

  return (
    <div className="container-page">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<GameSelectSkeleton count={12} label="Loading games…" />}>
          <GameBrowser locked={locked} />
        </Suspense>
      </HydrationBoundary>
    </div>
  );
}
