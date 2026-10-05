import "server-only";

import { REVALIDATE } from "@/server/cache";
import { AppError, isAppError } from "@/server/errors";
import { rawgFetch, type RawgParams } from "@/server/rawg/client";
import {
  mapGameDetail,
  mapGameList,
  mapGamePage,
  mapGenreSummary,
  mapList,
  mapPlatform,
  mapScreenshots,
} from "@/server/rawg/mappers";
import type {
  RawgGame,
  RawgGameDetail,
  RawgGenre,
  RawgList,
  RawgNamed,
  RawgScreenshot,
  RawgStoreLink,
} from "@/server/rawg/types";
import {
  DEFAULT_PAGE_SIZE,
  FIRST_RELEASE_YEAR,
  type GameDetail,
  type GameFilters,
  type GameSort,
  type GameSummary,
  type GenreSummary,
  type Paginated,
  type Platform,
  type Screenshot,
} from "@/types/game";

/**
 * Game services: the BFF's use cases. Route Handlers and Server Components
 * both call these, so there is exactly one path to the provider and one place
 * where its vocabulary (orderings, date ranges, ids) is translated.
 */

const SHELF_SIZE = 12;
const DAY = 86_400_000;

const ORDERING: Record<GameSort, string | undefined> = {
  relevance: undefined,
  popularity: "-added",
  rating: "-rating",
  metascore: "-metacritic",
  released: "-released",
  name: "name",
};

/** Dates are cut to the day so upstream URLs — and cache keys — stay stable. */
function isoDay(offsetDays = 0): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

export async function getGenres(): Promise<GenreSummary[]> {
  const raw = await rawgFetch<RawgList<RawgGenre>>(
    "/genres",
    { page_size: 40, ordering: "-games_count" },
    REVALIDATE.taxonomy,
  );
  return mapList(raw, mapGenreSummary);
}

export async function getPlatforms(): Promise<Platform[]> {
  const raw = await rawgFetch<RawgList<RawgNamed>>(
    "/platforms/lists/parents",
    { page_size: 40 },
    REVALIDATE.taxonomy,
  );
  return mapList(raw, mapPlatform);
}

export async function listGames(
  filters: GameFilters,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<Paginated<GameSummary>> {
  const params: RawgParams = {
    page: filters.page,
    page_size: pageSize,
    ordering: ORDERING[filters.sort],
    genres: filters.genre,
  };

  if (filters.q) {
    params.search = filters.q;
    params.search_precise = true;
  }

  if (filters.platform) {
    // Our URLs use readable slugs; the provider wants numeric family ids.
    const platform = (await getPlatforms()).find((p) => p.slug === filters.platform);
    if (!platform) throw new AppError("BAD_REQUEST", { message: "Unknown platform." });
    params.parent_platforms = platform.id;
  }

  if (filters.year) {
    params.dates = `${filters.year}-01-01,${filters.year}-12-31`;
  } else if (filters.sort === "released") {
    // "Newest" should mean newest playable, not placeholder dates years out.
    params.dates = `${FIRST_RELEASE_YEAR}-01-01,${isoDay()}`;
  }

  if (filters.score) params.metacritic = `${filters.score},100`;

  try {
    const raw = await rawgFetch<RawgList<RawgGame>>(
      "/games",
      params,
      filters.q ? REVALIDATE.search : REVALIDATE.list,
    );
    return mapGamePage(raw, filters.page, pageSize);
  } catch (error) {
    // The provider answers "page past the end" with a 404; for a list that is
    // simply an empty page, not a missing resource.
    if (isAppError(error) && error.code === "NOT_FOUND") {
      return { items: [], page: filters.page, pageSize, total: 0, hasNextPage: false };
    }
    throw error;
  }
}

async function shelf(params: RawgParams): Promise<GameSummary[]> {
  const raw = await rawgFetch<RawgList<RawgGame>>(
    "/games",
    { page_size: SHELF_SIZE, ...params },
    REVALIDATE.shelf,
  );
  return mapGameList(raw);
}

/** Most-added games released in the last year. */
export function getPopularGames(): Promise<GameSummary[]> {
  return shelf({ dates: `${isoDay(-365)},${isoDay()}`, ordering: "-added" });
}

/** Released in the last 60 days, most-added first so shovelware sinks. */
export function getRecentGames(): Promise<GameSummary[]> {
  return shelf({ dates: `${isoDay(-60)},${isoDay()}`, ordering: "-added" });
}

/** Most-anticipated games releasing within a year, soonest first. */
export async function getUpcomingGames(): Promise<GameSummary[]> {
  const games = await shelf({
    dates: `${isoDay(1)},${isoDay(365)}`,
    ordering: "-added",
  });
  return games.sort((a, b) =>
    (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999"),
  );
}

export async function getGame(slug: string): Promise<GameDetail> {
  const path = `/games/${encodeURIComponent(slug)}`;

  const [raw, storeLinks] = await Promise.all([
    rawgFetch<RawgGameDetail>(path, {}, REVALIDATE.game),
    // Store pages are a nice-to-have: if this call fails, the game still loads
    // and its stores link to their storefronts instead.
    rawgFetch<RawgList<RawgStoreLink>>(`${path}/stores`, {}, REVALIDATE.game).catch(
      () => null,
    ),
  ]);

  const game = mapGameDetail(raw, storeLinks?.results ?? []);
  // The provider follows slug redirects with a body that has no game in it.
  if (!game) throw new AppError("NOT_FOUND");
  return game;
}

export async function getScreenshots(slug: string): Promise<Screenshot[]> {
  const raw = await rawgFetch<RawgList<RawgScreenshot>>(
    `/games/${encodeURIComponent(slug)}/screenshots`,
    { page_size: 20 },
    REVALIDATE.game,
  );
  return mapScreenshots(raw);
}

/** Other games in the same series. */
export async function getSeries(slug: string): Promise<GameSummary[]> {
  const raw = await rawgFetch<RawgList<RawgGame>>(
    `/games/${encodeURIComponent(slug)}/game-series`,
    { page_size: 8 },
    REVALIDATE.game,
  );
  return mapGameList(raw);
}

const RANDOM_POOL_PAGES = 50;
const RANDOM_PAGE_SIZE = 20;

/**
 * "Surprise me" draws from the 1,000 most-added games with a Metacritic score
 * of 75+, so a surprise is always something worth opening. Pool pages are
 * cached for a day, which means most rolls cost no upstream request at all.
 */
async function randomPool(page: number): Promise<GameSummary[]> {
  try {
    const raw = await rawgFetch<RawgList<RawgGame>>(
      "/games",
      { metacritic: "75,100", ordering: "-added", page, page_size: RANDOM_PAGE_SIZE },
      REVALIDATE.taxonomy,
    );
    return mapGameList(raw);
  } catch (error) {
    // A page past the end of the pool is an empty draw, not a failure.
    if (isAppError(error) && error.code === "NOT_FOUND") return [];
    throw error;
  }
}

export async function getRandomGame(
  random: () => number = Math.random,
): Promise<GameSummary> {
  const page = 1 + Math.floor(random() * RANDOM_POOL_PAGES);
  let pool = await randomPool(page);
  // If the pool turned out shorter than expected, the first page always exists.
  if (pool.length === 0 && page !== 1) pool = await randomPool(1);

  const pick = pool[Math.floor(random() * pool.length)];
  if (!pick) throw new AppError("UPSTREAM_ERROR");
  return pick;
}
