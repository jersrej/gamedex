import { REVALIDATE } from "@/server/cache";
import { getGenres } from "@/server/games";
import { respond } from "@/server/respond";

/** GET /api/genres */
export function GET() {
  return respond(getGenres, { cacheSeconds: REVALIDATE.taxonomy });
}
