import { REVALIDATE } from "@/server/cache";
import { getPlatforms } from "@/server/games";
import { respond } from "@/server/respond";

/** GET /api/platforms */
export function GET() {
  return respond(getPlatforms, { cacheSeconds: REVALIDATE.taxonomy });
}
