import { REVALIDATE } from "@/server/cache";
import { getSeries } from "@/server/games";
import { requireSlug, respond } from "@/server/respond";

/** GET /api/games/:slug/series */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/games/[slug]/series">,
) {
  const { slug } = await ctx.params;
  return respond(() => getSeries(requireSlug(slug)), { cacheSeconds: REVALIDATE.game });
}
