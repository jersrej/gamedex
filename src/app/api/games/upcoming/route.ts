import { REVALIDATE } from "@/server/cache";
import { getUpcomingGames } from "@/server/games";
import { respond } from "@/server/respond";

/** GET /api/games/upcoming */
export function GET() {
  return respond(getUpcomingGames, { cacheSeconds: REVALIDATE.shelf });
}
