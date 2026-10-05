import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { game, jsonResponse } from "@/test/fixtures";
import { mockApi, navigation, renderWithQuery } from "@/test/render";

import { CommandSearch } from "./command-search";

vi.mock("next/navigation", () => ({
  useRouter: () => navigation.router,
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.search,
}));

function results(titles: string[]) {
  const items = titles.map((title, index) =>
    game({ id: index + 1, title, slug: title.toLowerCase().replaceAll(" ", "-") }),
  );
  return jsonResponse({ items, page: 1, pageSize: 6, total: items.length, hasNextPage: false });
}

beforeEach(() => navigation.reset("/"));

describe("CommandSearch", () => {
  it("debounces typing into a single request", async () => {
    const calls = mockApi(() => results(["Elden Ring"]));
    renderWithQuery(<CommandSearch open onOpenChange={() => {}} />);

    await userEvent.type(screen.getByRole("combobox"), "elden");

    expect(await screen.findByRole("option", { name: /Elden Ring/ })).toBeInTheDocument();
    expect(calls).toEqual(["/api/games?q=elden&pageSize=6"]);
  });

  it("does not search for a single character", async () => {
    const calls = mockApi(() => results([]));
    renderWithQuery(<CommandSearch open onOpenChange={() => {}} />);

    await userEvent.type(screen.getByRole("combobox"), "e");
    await new Promise((resolve) => setTimeout(resolve, 450));

    expect(calls).toEqual([]);
    expect(screen.getByRole("option", { name: "Browse all games" })).toBeInTheDocument();
  });

  it("opens the top result on Enter and closes", async () => {
    mockApi(() => results(["Hades", "Hades II"]));
    const onOpenChange = vi.fn();
    renderWithQuery(<CommandSearch open onOpenChange={onOpenChange} />);

    await userEvent.type(screen.getByRole("combobox"), "hades");
    await screen.findByRole("option", { name: /Hades II/ });
    await userEvent.keyboard("{Enter}");

    expect(navigation.router.push).toHaveBeenCalledWith("/games/hades");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("moves through results with the arrow keys", async () => {
    mockApi(() => results(["Hades", "Hades II"]));
    renderWithQuery(<CommandSearch open onOpenChange={() => {}} />);

    await userEvent.type(screen.getByRole("combobox"), "hades");
    await screen.findByRole("option", { name: /Hades II/ });
    await userEvent.keyboard("{ArrowDown}{Enter}");

    expect(navigation.router.push).toHaveBeenCalledWith("/games/hades-ii");
  });

  it("says so when nothing matches", async () => {
    mockApi(() => results([]));
    renderWithQuery(<CommandSearch open onOpenChange={() => {}} />);

    await userEvent.type(screen.getByRole("combobox"), "zzzz");

    expect(await screen.findByText("No games found")).toBeInTheDocument();
  });

  it("shows a readable error when the search fails", async () => {
    mockApi(() =>
      jsonResponse({ error: { code: "RATE_LIMITED", message: "Slow down." } }, { status: 429 }),
    );
    renderWithQuery(<CommandSearch open onOpenChange={() => {}} />);

    await userEvent.type(screen.getByRole("combobox"), "doom");

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Too many requests"));
  });
});
