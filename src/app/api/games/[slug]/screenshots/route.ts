import { REVALIDATE } from "@/server/cache";
import { getScreenshots } from "@/server/games";
import { requireSlug, respond } from "@/server/respond";

/** GET /api/games/:slug/screenshots */
export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/games/[slug]/screenshots">,
) {
  const { slug } = await ctx.params;
  return respond(() => getScreenshots(requireSlug(slug)), {
    cacheSeconds: REVALIDATE.game,
  });
}
