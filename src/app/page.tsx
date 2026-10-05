import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

import { catalogQueries } from "@/features/catalog/queries";
import { gameQueries } from "@/features/games/api/queries";
import { HomeMenu } from "@/features/home/home-menu";
import { getQueryClient } from "@/lib/query/client";
import { SITE_DESCRIPTION, SITE_NAME, siteUrl } from "@/lib/site";
import {
  getGenres,
  getPopularGames,
  getRecentGames,
  getUpcomingGames,
} from "@/server/games";

export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * schema.org WebSite, so search engines know the site's name and that
 * `/games?q=…` is its search — the same URL the archive's search field writes.
 */
function structuredData() {
  const origin = siteUrl().origin;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: origin,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${origin}/games?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData()).replace(/</g, "\\u003c"),
        }}
      />
      <HomeMenu />
    </HydrationBoundary>
  );
}
