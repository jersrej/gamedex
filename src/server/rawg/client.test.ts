import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsonResponse } from "@/test/fixtures";

import { rawgFetch } from "./client";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("GAME_API_KEY", "secret-key");
  vi.stubEnv("GAME_API_BASE_URL", "https://upstream.test/api/");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("rawgFetch", () => {
  it("adds the key server-side and caches with the given lifetime", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await expect(rawgFetch("/games", { page: 2, search: undefined }, 900)).resolves.toEqual({
      ok: true,
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://upstream.test/api/games?page=2&key=secret-key");
    expect(init?.next).toEqual({ revalidate: 900 });
  });

  it("fails with CONFIG_MISSING before any request when the key is absent", async () => {
    vi.stubEnv("GAME_API_KEY", "  ");

    await expect(rawgFetch("/games", {}, 60)).rejects.toMatchObject({
      code: "CONFIG_MISSING",
      status: 503,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [400, "BAD_REQUEST", 400],
    [401, "CONFIG_INVALID", 503],
    [403, "CONFIG_INVALID", 503],
    [404, "NOT_FOUND", 404],
    [500, "UPSTREAM_ERROR", 502],
    [503, "UPSTREAM_ERROR", 502],
  ])("maps upstream %i to %s", async (upstream, code, status) => {
    fetchMock.mockResolvedValue(new Response("<html>stack trace</html>", { status: upstream }));

    const error = await rawgFetch("/games", {}, 60).catch((e: unknown) => e);

    expect(error).toMatchObject({ code, status });
    // The upstream body must never become the message.
    expect((error as Error).message).not.toContain("stack trace");
  });

  it("carries Retry-After through on rate limiting", async () => {
    fetchMock.mockResolvedValue(
      new Response("{}", { status: 429, headers: { "retry-after": "30" } }),
    );

    await expect(rawgFetch("/games", {}, 60)).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
      retryAfter: 30,
    });
  });

  it("reports timeouts and network failures distinctly", async () => {
    fetchMock.mockRejectedValueOnce(new DOMException("timed out", "TimeoutError"));
    await expect(rawgFetch("/games", {}, 60)).rejects.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
      status: 504,
    });

    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    await expect(rawgFetch("/games", {}, 60)).rejects.toMatchObject({
      code: "UPSTREAM_UNREACHABLE",
      status: 502,
    });
  });

  it("treats an unreadable success body as an upstream error", async () => {
    fetchMock.mockResolvedValue(new Response("<html>", { status: 200 }));
    await expect(rawgFetch("/games", {}, 60)).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
    });
  });

  it("never writes the key to the logs", async () => {
    fetchMock.mockResolvedValue(new Response("", { status: 500 }));
    await rawgFetch("/games", {}, 60).catch(() => {});

    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("/games");
    expect(logged).not.toContain("secret-key");
  });
});
