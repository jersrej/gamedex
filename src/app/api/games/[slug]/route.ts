import { REVALIDATE } from "@/server/cache";
import { getGame } from "@/server/games";
import { requireSlug, respond } from "@/server/respond";

/** GET /api/games/:slug */
export async function GET(_request: Request, ctx: RouteContext<"/api/games/[slug]">) {
  const { slug } = await ctx.params;
  return respond(() => getGame(requireSlug(slug)), { cacheSeconds: REVALIDATE.game });
}
