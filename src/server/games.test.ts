import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, rawGame, rawGameDetail } from "@/test/fixtures";

import { getGame, getRandomGame, getUpcomingGames, listGames } from "./games";

const fetchMock = vi.fn<typeof fetch>();

/** Query parameters of the nth upstream call. */
function upstream(call = 0) {
  const url = new URL(String(fetchMock.mock.calls[call]![0]));
  return { path: url.pathname, params: Object.fromEntries(url.searchParams) };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GAME_API_KEY", "k");
  vi.stubEnv("GAME_API_BASE_URL", "https://upstream.test/api");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("listGames", () => {
  it("translates domain filters into provider parameters", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: 2, slug: "playstation", name: "PlayStation" }] }),
      )
      .mockResolvedValueOnce(jsonResponse({ count: 1, next: null, results: [rawGame()] }));

    const page = await listGames({
      q: "elden",
      genre: "action",
      platform: "playstation",
      year: 2022,
      score: 80,
      sort: "rating",
      page: 2,
    });

    expect(upstream(0).path).toBe("/api/platforms/lists/parents");
    expect(upstream(1).params).toMatchObject({
      search: "elden",
      search_precise: "true",
      genres: "action",
      parent_platforms: "2",
      dates: "2022-01-01,2022-12-31",
      metacritic: "80,100",
      ordering: "-rating",
      page: "2",
      page_size: "24",
    });
    expect(page.items[0]?.title).toBe("Elden Ring");
  });

  it("rejects a platform the provider does not have", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ results: [] }));

    await expect(
      listGames({ platform: "zx-spectrum", sort: "relevance", page: 1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps "newest" to games that are already out', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ count: 0, results: [] }));
    await listGames({ sort: "released", page: 1 });

    const today = new Date().toISOString().slice(0, 10);
    expect(upstream().params.dates).toBe(`1970-01-01,${today}`);
  });

  it("returns an empty page when paging past the end", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: "Invalid page." }, { status: 404 }));

    await expect(listGames({ sort: "relevance", page: 40 })).resolves.toEqual({
      items: [],
      page: 40,
      pageSize: 24,
      total: 0,
      hasNextPage: false,
    });
  });

  it("uses a shorter cache lifetime for free-text search", async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ count: 0, results: [] }));

    await listGames({ sort: "relevance", page: 1 });
    await listGames({ q: "zelda", sort: "relevance", page: 1 });

    const lifetimes = fetchMock.mock.calls.map(([, init]) => init?.next?.revalidate);
    expect(lifetimes).toEqual([900, 300]);
  });
});

describe("getGame", () => {
  it("still returns the game when store links can't be loaded", async () => {
    fetchMock.mockImplementation(async (input) =>
      String(input).includes("/stores?")
        ? new Response("", { status: 500 })
        : jsonResponse(rawGameDetail()),
    );

    const game = await getGame("elden-ring");

    expect(game.title).toBe("Elden Ring");
    expect(game.stores[0]).toEqual({
      id: 1,
      name: "Steam",
      url: "https://store.steampowered.com/",
    });
  });

  it("reports a missing game as NOT_FOUND", async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse({ detail: "Not found." }, { status: 404 }),
    );

    await expect(getGame("no-such-game")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("getUpcomingGames", () => {
  it("orders by release date, soonest first", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        results: [
          rawGame({ id: 1, slug: "later", name: "Later", released: "2099-06-01" }),
          rawGame({ id: 2, slug: "sooner", name: "Sooner", released: "2099-01-15" }),
        ],
      }),
    );

    const games = await getUpcomingGames();
    expect(games.map((g) => g.slug)).toEqual(["sooner", "later"]);
  });
});

describe("getRandomGame", () => {
  it("picks from a random page of the curated pool", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        results: [rawGame({ id: 1, slug: "a", name: "A" }), rawGame({ id: 2, slug: "b", name: "B" })],
      }),
    );

    const pick = await getRandomGame(() => 0.99);

    expect(upstream().params).toMatchObject({ metacritic: "75,100", page: "50" });
    expect(pick.slug).toBe("b");
  });

  it("falls back to the first page when the roll lands past the end", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ detail: "Invalid page." }, { status: 404 }))
      .mockResolvedValueOnce(jsonResponse({ results: [rawGame()] }));

    const pick = await getRandomGame(() => 0.5);

    expect(upstream(1).params.page).toBe("1");
    expect(pick.slug).toBe("elden-ring");
  });
});
