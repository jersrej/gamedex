/**
 * GameDex domain models.
 *
 * These are the only game shapes the UI knows about. The BFF maps whatever the
 * upstream provider returns into these, so swapping providers never touches a
 * component.
 */

export type Genre = {
  id: number;
  slug: string;
  name: string;
};

export type GenreSummary = Genre & {
  gamesCount: number | null;
  image: string | null;
};

/** A platform family (PC, PlayStation, Xbox…), not an individual console. */
export type Platform = {
  id: number;
  slug: string;
  name: string;
};

export type Company = {
  id: number;
  slug: string;
  name: string;
};

export type StoreLink = {
  id: number;
  name: string;
  url: string;
};

export type GameSummary = {
  id: number;
  slug: string;
  title: string;
  coverImage: string | null;
  /** ISO date (YYYY-MM-DD). */
  releaseDate: string | null;
  /** Release date not announced yet. */
  tba: boolean;
  /** Player rating, 0–5. Null when nobody has rated the game. */
  rating: number | null;
  ratingsCount: number;
  /** Metacritic score, 0–100. */
  metascore: number | null;
  /** Average playtime in hours. */
  playtime: number | null;
  genres: Genre[];
  platforms: Platform[];
};

export type GameDetail = GameSummary & {
  /** Plain-text paragraphs. */
  description: string[];
  backgroundImage: string | null;
  website: string | null;
  developers: Company[];
  publishers: Company[];
  ageRating: string | null;
  stores: StoreLink[];
  tags: string[];
};

export type Screenshot = {
  id: number;
  image: string;
  width: number;
  height: number;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
};

export const GAME_SORTS = [
  "relevance",
  "popularity",
  "rating",
  "metascore",
  "released",
  "name",
] as const;

export type GameSort = (typeof GAME_SORTS)[number];

export const MIN_SCORES = [70, 80, 90] as const;
export type MinScore = (typeof MIN_SCORES)[number];

export const FIRST_RELEASE_YEAR = 1970;
export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 40;
export const MAX_SEARCH_LENGTH = 80;

/** The query language shared by `/games?…` page URLs and `GET /api/games`. */
export type GameFilters = {
  q?: string;
  genre?: string;
  platform?: string;
  year?: number;
  score?: MinScore;
  sort: GameSort;
  page: number;
};
