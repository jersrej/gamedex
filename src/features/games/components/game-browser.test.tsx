import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { game, jsonResponse } from "@/test/fixtures";
import { makeTestQueryClient, mockApi, navigation, renderWithQuery } from "@/test/render";
import type { GameSummary, Paginated } from "@/types/game";

import { GameBrowser } from "./game-browser";

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.search,
}));

function page(items: GameSummary[], overrides: Partial<Paginated<GameSummary>> = {}) {
  return jsonResponse({
    items,
    page: 1,
    pageSize: 24,
    total: items.length,
    hasNextPage: false,
    ...overrides,
  });
}

const gameCalls = (calls: string[]) => calls.filter((call) => call.startsWith("/api/games"));

beforeEach(() => navigation.reset());

describe("GameBrowser", () => {
  it("lists the games for the filters in the URL", async () => {
    navigation.reset("/games", "genre=rpg&sort=rating");
    const calls = mockApi((url) =>
      url.pathname === "/api/games" ? page([game(), game({ id: 2, slug: "hades", title: "Hades" })]) : undefined,
    );

    renderWithQuery(<GameBrowser />);

    expect(await screen.findByRole("heading", { name: "Elden Ring" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Hades" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 games");
    expect(gameCalls(calls)).toEqual(["/api/games?genre=rpg&sort=rating"]);
  });

  it("writes a typed search to the URL once, and resets to page 1", async () => {
    navigation.reset("/games", "genre=rpg&page=3");
    mockApi((url) => (url.pathname === "/api/games" ? page([game()]) : undefined));
    renderWithQuery(<GameBrowser />);

    await userEvent.type(screen.getByRole("searchbox"), "hades");

    await waitFor(() =>
      expect(navigation.router.replace).toHaveBeenCalledWith("/games?q=hades&genre=rpg", {
        scroll: false,
      }),
    );
    expect(navigation.router.replace).toHaveBeenCalledTimes(1);
  });

  it("removes a filter from its chip", async () => {
    navigation.reset("/games", "year=2022&score=90");
    mockApi((url) => (url.pathname === "/api/games" ? page([game()]) : undefined));
    renderWithQuery(<GameBrowser />);

    await userEvent.click(await screen.findByRole("button", { name: /Remove filter: 2022/ }));

    expect(navigation.router.push).toHaveBeenCalledWith("/games?score=90", { scroll: false });
  });

  it("links to the next page and prefetches it", async () => {
    const calls = mockApi((url) =>
      url.pathname === "/api/games" ? page([game()], { total: 60, hasNextPage: true }) : undefined,
    );
    renderWithQuery(<GameBrowser />);

    expect(await screen.findByRole("link", { name: "Next" })).toHaveAttribute("href", "/games?page=2");
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    await waitFor(() => expect(gameCalls(calls)).toContain("/api/games?page=2"));
  });

  it("serves a repeat view from the query cache", async () => {
    const calls = mockApi((url) => (url.pathname === "/api/games" ? page([game()]) : undefined));
    const client = makeTestQueryClient();
    client.setDefaultOptions({ queries: { staleTime: 60_000 } });

    const first = renderWithQuery(<GameBrowser />, client);
    await screen.findByRole("heading", { name: "Elden Ring" });
    first.unmount();

    renderWithQuery(<GameBrowser />, client);
    expect(screen.getByRole("heading", { name: "Elden Ring" })).toBeInTheDocument();
    expect(gameCalls(calls)).toHaveLength(1);
  });

  it("offers a way out when nothing matches", async () => {
    navigation.reset("/games", "q=zzzz&genre=rpg");
    mockApi((url) => (url.pathname === "/api/games" ? page([]) : undefined));
    renderWithQuery(<GameBrowser />);

    expect(await screen.findByRole("heading", { name: "No games found" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear search and filters" }));
    expect(navigation.router.push).toHaveBeenCalledWith("/games", { scroll: false });
  });

  it("keeps a genre page's own genre out of the query string", async () => {
    navigation.reset("/genres/rpg", "year=2020");
    const calls = mockApi((url) => (url.pathname === "/api/games" ? page([game()]) : undefined));
    renderWithQuery(<GameBrowser locked={{ genre: "rpg" }} />);

    await userEvent.click(await screen.findByRole("button", { name: /Remove filter: 2020/ }));

    expect(gameCalls(calls)[0]).toBe("/api/games?genre=rpg&year=2020");
    expect(navigation.router.push).toHaveBeenCalledWith("/genres/rpg", { scroll: false });
    expect(screen.queryByRole("combobox", { name: "Genre" })).not.toBeInTheDocument();
  });

  it("explains rate limiting, does not auto-retry it, and retries on request", async () => {
    let limited = true;
    const calls = mockApi((url) => {
      if (url.pathname !== "/api/games") return undefined;
      return limited
        ? jsonResponse(
            { error: { code: "RATE_LIMITED", message: "Slow down.", retryAfter: 30 } },
            { status: 429 },
          )
        : page([game()]);
    });
    renderWithQuery(<GameBrowser />);

    expect(await screen.findByRole("heading", { name: "Too many requests" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Try again in 30 seconds");
    expect(gameCalls(calls)).toHaveLength(1);

    limited = false;
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("heading", { name: "Elden Ring" })).toBeInTheDocument();
  });

  it("retries a transient outage, then reports it without raw details", async () => {
    const calls = mockApi((url) =>
      url.pathname === "/api/games"
        ? jsonResponse(
            { error: { code: "UPSTREAM_ERROR", message: "The game database returned an error." } },
            { status: 502 },
          )
        : undefined,
    );
    renderWithQuery(<GameBrowser />);

    expect(await screen.findByRole("heading", { name: "Game database offline" })).toBeInTheDocument();
    expect(gameCalls(calls)).toHaveLength(3);
  });

  it("tells the developer when the API key is missing", async () => {
    mockApi((url) =>
      url.pathname === "/api/games"
        ? jsonResponse(
            {
              error: {
                code: "CONFIG_MISSING",
                message:
                  "Game API configuration is missing. Please configure the required server environment variables.",
              },
            },
            { status: 503 },
          )
        : undefined,
    );
    renderWithQuery(<GameBrowser />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Game API configuration is missing.");
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
