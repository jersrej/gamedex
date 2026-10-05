import type { GameSummary } from "@/types/game";

/**
 * The personal library: favourites and play status, kept in localStorage.
 *
 * This is client state the visitor owns, so it deliberately lives outside
 * TanStack Query (which holds server state). A small external store plus
 * `useSyncExternalStore` gives every component the same view and keeps
 * multiple tabs in sync — no state library needed.
 */

export const LIBRARY_STATUSES = ["want", "playing", "completed", "dropped"] as const;
export type LibraryStatus = (typeof LIBRARY_STATUSES)[number];

export const STATUS_LABELS: Record<LibraryStatus, string> = {
  want: "Want to play",
  playing: "Playing",
  completed: "Completed",
  dropped: "Dropped",
};

/** The slice of a game we keep so the library renders without any request. */
export type LibraryGame = Pick<
  GameSummary,
  "id" | "slug" | "title" | "coverImage" | "releaseDate"
>;

export type LibraryEntry = {
  game: LibraryGame;
  favorite: boolean;
  status: LibraryStatus | null;
  updatedAt: number;
};

export type LibraryState = Readonly<Record<number, LibraryEntry>>;

export const STORAGE_KEY = "gamedex.library.v1";
const EMPTY: LibraryState = Object.freeze({});

let state: LibraryState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function isEntry(value: unknown): value is LibraryEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<LibraryEntry>;
  return (
    typeof entry.game?.id === "number" &&
    typeof entry.game.slug === "string" &&
    typeof entry.game.title === "string" &&
    typeof entry.favorite === "boolean" &&
    (entry.status === null ||
      (LIBRARY_STATUSES as readonly unknown[]).includes(entry.status))
  );
}

function read(): LibraryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY;
    const entries = Object.values(parsed).filter(isEntry);
    return Object.fromEntries(entries.map((entry) => [entry.game.id, entry]));
  } catch {
    // Corrupt or unavailable storage: start empty rather than break the app.
    return EMPTY;
  }
}

function write(next: LibraryState): void {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: the session still works, it just won't persist.
  }
  listeners.forEach((listener) => listener());
}

function toLibraryGame(game: LibraryGame): LibraryGame {
  const { id, slug, title, coverImage, releaseDate } = game;
  return { id, slug, title, coverImage, releaseDate };
}

function update(
  game: LibraryGame,
  change: (entry: LibraryEntry) => Pick<LibraryEntry, "favorite" | "status">,
): void {
  const current = getSnapshot();
  const previous: LibraryEntry = current[game.id] ?? {
    game: toLibraryGame(game),
    favorite: false,
    status: null,
    updatedAt: 0,
  };
  const changed = change(previous);
  const next = { ...current };

  // An entry with neither a favourite mark nor a status is simply not in the library.
  if (!changed.favorite && changed.status === null) delete next[game.id];
  else {
    next[game.id] = { game: toLibraryGame(game), ...changed, updatedAt: Date.now() };
  }
  write(next);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    state = read();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): LibraryState {
  if (!loaded) {
    state = read();
    loaded = true;
  }
  return state;
}

/** The server has no library; hydration starts empty and fills in after. */
export function getServerSnapshot(): LibraryState {
  return EMPTY;
}

export function toggleFavorite(game: LibraryGame): void {
  update(game, (entry) => ({ favorite: !entry.favorite, status: entry.status }));
}

export function setStatus(game: LibraryGame, status: LibraryStatus | null): void {
  update(game, (entry) => ({ favorite: entry.favorite, status }));
}

export function removeFromLibrary(game: LibraryGame): void {
  update(game, () => ({ favorite: false, status: null }));
}

/** Test hook: forget the in-memory copy so the next read hits storage again. */
export function resetLibraryStore(): void {
  state = EMPTY;
  loaded = false;
}
