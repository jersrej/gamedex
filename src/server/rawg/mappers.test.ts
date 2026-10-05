import { describe, expect, it } from "vitest";

import { rawGame, rawGameDetail } from "@/test/fixtures";

import { mapGameDetail, mapGamePage, mapGameSummary, mapScreenshots } from "./mappers";

describe("mapGameSummary", () => {
  it("normalises a provider game into the domain model", () => {
    expect(mapGameSummary(rawGame())).toEqual({
      id: 326243,
      slug: "elden-ring",
      title: "Elden Ring",
      coverImage: "https://media.rawg.io/media/games/b29/elden.jpg",
      releaseDate: "2022-02-25",
      tba: false,
      rating: 4.41,
      ratingsCount: 5120,
      metascore: 95,
      playtime: 57,
      genres: [
        { id: 4, slug: "action", name: "Action" },
        { id: 5, slug: "role-playing-games-rpg", name: "RPG" },
      ],
      platforms: [
        { id: 1, slug: "pc", name: "PC" },
        { id: 2, slug: "playstation", name: "PlayStation" },
      ],
    });
  });

  it("does not leak provider field names", () => {
    const mapped = mapGameSummary(rawGame());
    expect(Object.keys(mapped ?? {})).not.toEqual(
      expect.arrayContaining(["name", "background_image", "released", "parent_platforms"]),
    );
  });

  it("treats the provider's zero placeholders as missing values", () => {
    const mapped = mapGameSummary(
      rawGame({ rating: 0, ratings_count: 0, metacritic: null, playtime: 0 }),
    );
    expect(mapped).toMatchObject({ rating: null, metascore: null, playtime: null });
  });

  it("survives missing and malformed fields", () => {
    const mapped = mapGameSummary({
      id: 7,
      slug: "bare",
      name: "Bare",
      released: "soon",
      background_image: "not a url",
      genres: null,
      parent_platforms: [{}, { platform: { id: 1, slug: "pc", name: "PC" } }],
    });
    expect(mapped).toMatchObject({
      releaseDate: null,
      coverImage: null,
      genres: [],
      platforms: [{ id: 1, slug: "pc", name: "PC" }],
    });
  });

  it("rejects entries without an identity", () => {
    expect(mapGameSummary({ name: "No id" })).toBeNull();
  });
});

describe("mapGameDetail", () => {
  const detail = mapGameDetail(rawGameDetail());

  it("splits the description into clean paragraphs", () => {
    expect(detail?.description).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("upgrades http links and drops unsafe ones", () => {
    expect(detail?.website).toBe("https://eldenring.example/");
    expect(detail?.backgroundImage).toMatch(/^https:/);
    expect(detail?.stores).toEqual([
      { id: 1, name: "Steam", url: "https://store.steampowered.com/" },
      { id: 3, name: "PlayStation Store", url: "https://store.playstation.com/elden" },
    ]);
  });

  it("prefers the game's own store page when one is known", () => {
    const withLinks = mapGameDetail(rawGameDetail(), [
      { store_id: 1, url: "https://store.steampowered.com/app/1245620/" },
      { store_id: 3, url: "" },
    ]);
    expect(withLinks?.stores.map((store) => store.url)).toEqual([
      "https://store.steampowered.com/app/1245620/",
      "https://store.playstation.com/elden",
    ]);
  });

  it("keeps only English tags and flattens companies and age rating", () => {
    expect(detail).toMatchObject({
      tags: ["Singleplayer"],
      developers: [{ name: "FromSoftware" }],
      publishers: [{ name: "Bandai Namco" }],
      ageRating: "Mature",
    });
  });
});

describe("list mappers", () => {
  it("builds a page and skips unusable rows", () => {
    const page = mapGamePage({ count: 51, next: "…", results: [rawGame(), {}] }, 2, 24);
    expect(page).toMatchObject({ page: 2, pageSize: 24, total: 51, hasNextPage: true });
    expect(page.items).toHaveLength(1);
  });

  it("drops deleted screenshots and fills missing dimensions", () => {
    const shots = mapScreenshots({
      results: [
        { id: 1, image: "https://media.rawg.io/a.jpg", width: 1280, height: 720 },
        { id: 2, image: "https://media.rawg.io/b.jpg", is_deleted: true },
        { id: 3, image: "https://media.rawg.io/c.jpg", width: null, height: null },
      ],
    });
    expect(shots).toEqual([
      { id: 1, image: "https://media.rawg.io/a.jpg", width: 1280, height: 720 },
      { id: 3, image: "https://media.rawg.io/c.jpg", width: 1920, height: 1080 },
    ]);
  });
});
