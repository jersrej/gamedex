import type { NextRequest } from "next/server";

import { parseGameFilters } from "@/lib/games/filters";
import { REVALIDATE } from "@/server/cache";
import { AppError } from "@/server/errors";
import { listGames } from "@/server/games";
import { respond } from "@/server/respond";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/types/game";

function parsePageSize(value: string | null): number {
  if (value === null) return DEFAULT_PAGE_SIZE;
  const size = /^\d{1,3}$/.test(value) ? Number(value) : NaN;
  if (!(size >= 1 && size <= MAX_PAGE_SIZE)) {
    throw new AppError("BAD_REQUEST", { message: "Invalid query parameter: pageSize." });
  }
  return size;
}

/** GET /api/games?q&genre&platform&year&score&sort&page&pageSize */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const { filters, invalid } = parseGameFilters(params);

  return respond(
    () => {
      // Only the whitelisted, validated filters above ever reach the provider;
      // unknown query parameters are dropped, invalid ones are refused.
      if (invalid.length > 0) {
        throw new AppError("BAD_REQUEST", {
          message: `Invalid query parameter: ${invalid.join(", ")}.`,
        });
      }
      return listGames(filters, parsePageSize(params.get("pageSize")));
    },
    { cacheSeconds: filters.q ? REVALIDATE.search : REVALIDATE.list },
  );
}
