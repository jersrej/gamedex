import { REVALIDATE } from "@/server/cache";
import { getRecentGames } from "@/server/games";
import { respond } from "@/server/respond";

/** GET /api/games/recent */
export function GET() {
  return respond(getRecentGames, { cacheSeconds: REVALIDATE.shelf });
}
