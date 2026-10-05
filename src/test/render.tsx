import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { vi } from "vitest";

import { shouldRetry } from "@/lib/query/client";

/** Shared stand-in for `next/navigation`; tests set `search` and inspect `router`. */
export const navigation = {
  pathname: "/games",
  search: new URLSearchParams(),
  router: { push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() },
  reset(pathname = "/games", search = "") {
    this.pathname = pathname;
    this.search = new URLSearchParams(search);
    this.router.push.mockReset();
    this.router.replace.mockReset();
  },
};

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    // Same retry rules as production, without the back-off wait.
    defaultOptions: { queries: { retry: shouldRetry, retryDelay: 0 } },
  });
}

export function renderWithQuery(ui: ReactElement, client = makeTestQueryClient()) {
  return {
    client,
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
  };
}

type Route = (url: URL) => Response | undefined;

/** Stubs `fetch` for calls to our own API and records the paths requested. */
export function mockApi(route: Route) {
  const calls: string[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      calls.push(url.pathname + url.search);
      return route(url) ?? new Response(JSON.stringify([]), { status: 200 });
    }),
  );
  return calls;
}
