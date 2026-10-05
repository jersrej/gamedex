import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { catalogQueries } from "@/features/catalog/queries";
import { gameQueries } from "@/features/games/api/queries";
import { HomeMenu } from "@/features/home/home-menu";
import { getQueryClient } from "@/lib/query/client";
import {
  getGenres,
  getPopularGames,
  getRecentGames,
  getUpcomingGames,
} from "@/server/games";

// Rebuilt at most hourly — the same cadence as the shelves it shows.
export const revalidate = 3600;

export default async function HomePage() {
  const queryClient = getQueryClient();

  // Fill the query cache on the server so the page arrives with its games.
  // `prefetchQuery` never throws: a failed shelf is simply left for the browser
  // to request, where it gets a proper error state and a retry button.
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: gameQueries.popular().queryKey,
      queryFn: getPopularGames,
    }),
    queryClient.prefetchQuery({
      queryKey: gameQueries.recent().queryKey,
      queryFn: getRecentGames,
    }),
    queryClient.prefetchQuery({
      queryKey: gameQueries.upcoming().queryKey,
      queryFn: getUpcomingGames,
    }),
    queryClient.prefetchQuery({
      queryKey: catalogQueries.genres().queryKey,
      queryFn: getGenres,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomeMenu />
    </HydrationBoundary>
  );
}
