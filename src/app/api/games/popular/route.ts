import { REVALIDATE } from "@/server/cache";
import { getPopularGames } from "@/server/games";
import { respond } from "@/server/respond";

/** GET /api/games/popular */
export function GET() {
  return respond(getPopularGames, { cacheSeconds: REVALIDATE.shelf });
}
