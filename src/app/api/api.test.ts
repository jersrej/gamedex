import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse, rawGame, rawGameDetail } from "@/test/fixtures";

import { GET as getGame } from "./games/[slug]/route";
import { GET as listGames } from "./games/route";

const fetchMock = vi.fn<typeof fetch>();

const list = (query: string) => listGames(new NextRequest(`http://localhost/api/games${query}`));
const detail = (slug: string) =>
  getGame(new Request(`http://localhost/api/games/${slug}`), {
    params: Promise.resolve({ slug }),
  });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GAME_API_KEY", "secret-key");
  vi.stubEnv("GAME_API_BASE_URL", "https://upstream.test/api");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("GET /api/games", () => {
  it("returns normalised, cacheable games", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ count: 1, next: null, results: [rawGame()] }));

    const response = await list("?q=elden&pageSize=6");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");
    const body = await response.json();
    expect(body).toMatchObject({ page: 1, pageSize: 6, total: 1, hasNextPage: false });
    expect(body.items[0]).toMatchObject({ title: "Elden Ring", metascore: 95 });
  });

  it("rejects invalid parameters without calling the provider", async () => {
    const response = await list("?sort=price&page=-1");

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: { code: "BAD_REQUEST", message: "Invalid query parameter: sort, page." },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("caps page size", async () => {
    expect((await list("?pageSize=500")).status).toBe(400);
  });

  it("never forwards parameters the browser invented", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ count: 0, results: [] }));

    await list("?key=attacker&ordering=-added&dates=1900-01-01,2100-01-01&q=doom");

    const forwarded = new URL(String(fetchMock.mock.calls[0]![0])).searchParams;
    expect(forwarded.get("key")).toBe("secret-key");
    expect(forwarded.has("ordering")).toBe(false);
    expect(forwarded.has("dates")).toBe(false);
    expect(forwarded.get("search")).toBe("doom");
  });

  it("explains a missing API key without revealing anything", async () => {
    vi.stubEnv("GAME_API_KEY", "");

    const response = await list("");

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: {
        code: "CONFIG_MISSING",
        message:
          "Game API configuration is missing. Please configure the required server environment variables.",
      },
    });
  });

  it("passes rate limiting on with Retry-After", async () => {
    fetchMock.mockResolvedValue(
      new Response("throttled", { status: 429, headers: { "retry-after": "17" } }),
    );

    const response = await list("");

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("17");
    expect((await response.json()).error).toMatchObject({ code: "RATE_LIMITED", retryAfter: 17 });
  });

  it("hides upstream failures behind a generic 502", async () => {
    fetchMock.mockResolvedValue(new Response("Traceback: db password=hunter2", { status: 500 }));

    const response = await list("");
    const text = await response.text();

    expect(response.status).toBe(502);
    expect(text).not.toContain("hunter2");
    expect(JSON.parse(text).error.code).toBe("UPSTREAM_ERROR");
  });
});

describe("GET /api/games/:slug", () => {
  it("returns a normalised game", async () => {
    fetchMock.mockImplementation(async (input) =>
      String(input).includes("/stores?")
        ? jsonResponse({ results: [{ store_id: 1, url: "https://store.steampowered.com/app/1245620/" }] })
        : jsonResponse(rawGameDetail()),
    );

    const response = await detail("elden-ring");

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      title: "Elden Ring",
      developers: [{ name: "FromSoftware" }],
      stores: [{ name: "Steam", url: "https://store.steampowered.com/app/1245620/" }, {}],
    });
  });

  it("returns 404 for an unknown game", async () => {
    fetchMock.mockImplementation(async () =>
      jsonResponse({ detail: "Not found." }, { status: 404 }),
    );

    const response = await detail("no-such-game");

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("NOT_FOUND");
  });

  it("refuses slugs that could rewrite the upstream path", async () => {
    const response = await detail("../genres");

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
