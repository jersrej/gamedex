/**
 * Raw provider shapes. Everything is optional/nullable on purpose: this is
 * untrusted input and the mappers are responsible for making it safe.
 * Only the fields GameDex actually reads are declared.
 */

export type RawgNamed = {
  id?: number;
  slug?: string;
  name?: string;
};

export type RawgGenre = RawgNamed & {
  games_count?: number | null;
  image_background?: string | null;
};

export type RawgGame = {
  id?: number;
  slug?: string;
  name?: string;
  background_image?: string | null;
  released?: string | null;
  tba?: boolean;
  rating?: number | null;
  ratings_count?: number | null;
  metacritic?: number | null;
  playtime?: number | null;
  genres?: RawgNamed[] | null;
  parent_platforms?: { platform?: RawgNamed }[] | null;
};

export type RawgGameDetail = RawgGame & {
  description_raw?: string | null;
  background_image_additional?: string | null;
  website?: string | null;
  developers?: RawgNamed[] | null;
  publishers?: RawgNamed[] | null;
  esrb_rating?: RawgNamed | null;
  stores?:
    | { id?: number; url?: string | null; store?: RawgNamed & { domain?: string | null } }[]
    | null;
  tags?: (RawgNamed & { language?: string })[] | null;
};

/** From `/games/:id/stores` — the per-game store pages the detail payload omits. */
export type RawgStoreLink = {
  store_id?: number;
  url?: string | null;
};

export type RawgScreenshot = {
  id?: number;
  image?: string | null;
  width?: number | null;
  height?: number | null;
  is_deleted?: boolean;
};

export type RawgList<T> = {
  count?: number;
  next?: string | null;
  results?: T[] | null;
};
