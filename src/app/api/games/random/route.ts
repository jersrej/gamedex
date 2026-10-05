import { getRandomGame } from "@/server/games";
import { respond } from "@/server/respond";

// Every call must roll again, so this route is never prerendered or cached.
export const dynamic = "force-dynamic";

/** GET /api/games/random */
export function GET() {
  return respond(() => getRandomGame(), { cacheSeconds: null });
}
