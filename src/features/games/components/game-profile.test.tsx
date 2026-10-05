import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { game, jsonResponse } from "@/test/fixtures";
import { mockApi, navigation, renderWithQuery } from "@/test/render";
import type { GameDetail } from "@/types/game";

import { GameProfile } from "./game-profile";

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.search,
}));

const detail: GameDetail = {
  ...game(),
  description: ["A vast world.", "Hard but fair.", "Third paragraph."],
  backgroundImage: null,
  website: "https://eldenring.example/",
  developers: [{ id: 1, slug: "fromsoftware", name: "FromSoftware" }],
  publishers: [{ id: 2, slug: "bandai-namco", name: "Bandai Namco" }],
  ageRating: "Mature",
  stores: [{ id: 1, name: "Steam", url: "https://store.steampowered.com/" }],
  tags: ["Singleplayer"],
};

beforeEach(() => navigation.reset("/games/elden-ring"));

describe("GameProfile", () => {
  it("shows a loading state, then the game's profile", async () => {
    const calls = mockApi((url) =>
      url.pathname === "/api/games/elden-ring" ? jsonResponse(detail) : undefined,
    );
    renderWithQuery(<GameProfile slug="elden-ring" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading game file…");

    expect(await screen.findByRole("heading", { level: 1, name: "Elden Ring" })).toBeInTheDocument();
    expect(screen.getByText("February 25, 2022")).toBeInTheDocument();
    expect(screen.getByText("FromSoftware")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "RPG" })).toHaveAttribute("href", "/genres/rpg");
    expect(screen.getByRole("link", { name: /Steam/ })).toHaveAttribute("rel", "noreferrer");

    // Screenshots and series wait until they are scrolled near.
    expect(calls).toEqual(["/api/games/elden-ring"]);
  });

  it("collapses a long description", async () => {
    mockApi((url) => (url.pathname === "/api/games/elden-ring" ? jsonResponse(detail) : undefined));
    renderWithQuery(<GameProfile slug="elden-ring" />);

    await screen.findByText("Hard but fair.");
    expect(screen.queryByText("Third paragraph.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Read more" })).toHaveAttribute("aria-expanded", "false");
  });

  it("reports a game that does not exist, without retrying", async () => {
    const calls = mockApi(() =>
      jsonResponse({ error: { code: "NOT_FOUND", message: "Nope." } }, { status: 404 }),
    );
    renderWithQuery(<GameProfile slug="no-such-game" />);

    expect(await screen.findByRole("heading", { name: "No such game" })).toBeInTheDocument();
    expect(calls).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  });
});
