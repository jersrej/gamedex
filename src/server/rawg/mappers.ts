import type {
  Company,
  GameDetail,
  GameSummary,
  Genre,
  GenreSummary,
  Paginated,
  Platform,
  Screenshot,
  StoreLink,
} from "@/types/game";

import type {
  RawgGame,
  RawgGameDetail,
  RawgGenre,
  RawgList,
  RawgNamed,
  RawgScreenshot,
  RawgStoreLink,
} from "./types";

const MAX_TAGS = 10;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Named = { id: number; slug: string; name: string };

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function mapNamed(raw: RawgNamed | null | undefined): Named | null {
  if (!raw || typeof raw.id !== "number" || !raw.slug || !raw.name) return null;
  return { id: raw.id, slug: raw.slug, name: raw.name };
}

function mapNamedList(raw: (RawgNamed | undefined)[] | null | undefined): Named[] {
  return (raw ?? []).map(mapNamed).filter(isPresent);
}

function httpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function positive(value: number | null | undefined): number | null {
  return typeof value === "number" && value > 0 ? value : null;
}

export function mapGenre(raw: RawgNamed): Genre | null {
  return mapNamed(raw);
}

export function mapGenreSummary(raw: RawgGenre): GenreSummary | null {
  const genre = mapNamed(raw);
  if (!genre) return null;
  return {
    ...genre,
    gamesCount: positive(raw.games_count),
    image: httpsUrl(raw.image_background),
  };
}

export function mapPlatform(raw: RawgNamed): Platform | null {
  return mapNamed(raw);
}

export function mapGameSummary(raw: RawgGame): GameSummary | null {
  if (typeof raw.id !== "number" || !raw.slug || !raw.name) return null;

  const ratingsCount = raw.ratings_count ?? 0;

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.name,
    coverImage: httpsUrl(raw.background_image),
    releaseDate: raw.released && ISO_DATE.test(raw.released) ? raw.released : null,
    tba: raw.tba === true,
    // The provider reports 0 for "nobody rated this", which is not a rating.
    rating: ratingsCount > 0 ? positive(raw.rating) : null,
    ratingsCount,
    metascore: positive(raw.metacritic),
    playtime: positive(raw.playtime),
    genres: mapNamedList(raw.genres),
    platforms: mapNamedList((raw.parent_platforms ?? []).map((p) => p.platform)),
  };
}

function mapStores(raw: RawgGameDetail["stores"], links: RawgStoreLink[]): StoreLink[] {
  return (raw ?? [])
    .map((entry): StoreLink | null => {
      const store = mapNamed(entry.store);
      if (!store) return null;
      // Prefer the game's own page in the store; fall back to the storefront.
      const url =
        httpsUrl(links.find((link) => link.store_id === store.id)?.url) ??
        httpsUrl(entry.url) ??
        (entry.store?.domain ? httpsUrl(`https://${entry.store.domain}`) : null);
      return url ? { id: store.id, name: store.name, url } : null;
    })
    .filter(isPresent);
}

function mapDescription(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\n{2,}|\r\n\r\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

export function mapGameDetail(
  raw: RawgGameDetail,
  storeLinks: RawgStoreLink[] = [],
): GameDetail | null {
  const summary = mapGameSummary(raw);
  if (!summary) return null;

  const companies = (list: RawgNamed[] | null | undefined): Company[] =>
    mapNamedList(list);

  return {
    ...summary,
    description: mapDescription(raw.description_raw),
    backgroundImage: httpsUrl(raw.background_image_additional),
    website: httpsUrl(raw.website),
    developers: companies(raw.developers),
    publishers: companies(raw.publishers),
    ageRating: raw.esrb_rating?.name ?? null,
    stores: mapStores(raw.stores, storeLinks),
    tags: (raw.tags ?? [])
      .filter((tag) => tag.language === "eng" && tag.name)
      .slice(0, MAX_TAGS)
      .map((tag) => tag.name as string),
  };
}

export function mapScreenshots(raw: RawgList<RawgScreenshot>): Screenshot[] {
  return (raw.results ?? [])
    .map((shot): Screenshot | null => {
      const image = httpsUrl(shot.image);
      if (shot.is_deleted || typeof shot.id !== "number" || !image) return null;
      return {
        id: shot.id,
        image,
        width: positive(shot.width) ?? 1920,
        height: positive(shot.height) ?? 1080,
      };
    })
    .filter(isPresent);
}

export function mapGameList(raw: RawgList<RawgGame>): GameSummary[] {
  return (raw.results ?? []).map(mapGameSummary).filter(isPresent);
}

export function mapGamePage(
  raw: RawgList<RawgGame>,
  page: number,
  pageSize: number,
): Paginated<GameSummary> {
  return {
    items: mapGameList(raw),
    page,
    pageSize,
    total: raw.count ?? 0,
    hasNextPage: Boolean(raw.next),
  };
}

export function mapList<Raw, Out>(
  raw: RawgList<Raw>,
  map: (item: Raw) => Out | null,
): Out[] {
  return (raw.results ?? []).map(map).filter(isPresent);
}
