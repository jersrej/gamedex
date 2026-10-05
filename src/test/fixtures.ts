import type { RawgGame, RawgGameDetail } from "@/server/rawg/types";
import type { GameSummary } from "@/types/game";

/** A provider-shaped game, as the upstream API would return it. */
export function rawGame(overrides: Partial<RawgGame> = {}): RawgGame {
  return {
    id: 326243,
    slug: "elden-ring",
    name: "Elden Ring",
    background_image: "https://media.rawg.io/media/games/b29/elden.jpg",
    released: "2022-02-25",
    tba: false,
    rating: 4.41,
    ratings_count: 5120,
    metacritic: 95,
    playtime: 57,
    genres: [
      { id: 4, slug: "action", name: "Action" },
      { id: 5, slug: "role-playing-games-rpg", name: "RPG" },
    ],
    parent_platforms: [
      { platform: { id: 1, slug: "pc", name: "PC" } },
      { platform: { id: 2, slug: "playstation", name: "PlayStation" } },
    ],
    ...overrides,
  };
}

export function rawGameDetail(overrides: Partial<RawgGameDetail> = {}): RawgGameDetail {
  return {
    ...rawGame(),
    description_raw: "First paragraph.\n\nSecond   paragraph.\n\n",
    background_image_additional: "http://media.rawg.io/media/screenshots/extra.jpg",
    website: "http://eldenring.example",
    developers: [{ id: 6763, slug: "fromsoftware", name: "FromSoftware" }],
    publishers: [{ id: 109, slug: "bandai-namco", name: "Bandai Namco" }],
    esrb_rating: { id: 4, slug: "mature", name: "Mature" },
    stores: [
      { id: 1, url: "", store: { id: 1, slug: "steam", name: "Steam", domain: "store.steampowered.com" } },
      { id: 2, url: "https://store.playstation.com/elden", store: { id: 3, slug: "ps", name: "PlayStation Store" } },
      { id: 3, url: "javascript:alert(1)", store: { id: 9, slug: "bad", name: "Bad Store" } },
    ],
    tags: [
      { id: 1, slug: "singleplayer", name: "Singleplayer", language: "eng" },
      { id: 2, slug: "ru", name: "Для одного игрока", language: "rus" },
    ],
    ...overrides,
  };
}

/** A domain-shaped game, as the BFF returns it to the browser. */
export function game(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    id: 1,
    slug: "elden-ring",
    title: "Elden Ring",
    coverImage: null,
    releaseDate: "2022-02-25",
    tba: false,
    rating: 4.4,
    ratingsCount: 5120,
    metascore: 95,
    playtime: 57,
    genres: [{ id: 5, slug: "rpg", name: "RPG" }],
    platforms: [{ id: 1, slug: "pc", name: "PC" }],
    ...overrides,
  };
}

export function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}
