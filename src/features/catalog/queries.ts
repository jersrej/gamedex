import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api/client";
import { STALE } from "@/lib/query/stale-times";
import type { GenreSummary, Platform } from "@/types/game";

export const catalogQueries = {
  genres: () =>
    queryOptions({
      queryKey: ["catalog", "genres"] as const,
      queryFn: ({ signal }) => apiGet<GenreSummary[]>("/api/genres", { signal }),
      staleTime: STALE.taxonomy,
    }),

  platforms: () =>
    queryOptions({
      queryKey: ["catalog", "platforms"] as const,
      queryFn: ({ signal }) => apiGet<Platform[]>("/api/platforms", { signal }),
      staleTime: STALE.taxonomy,
    }),
};
