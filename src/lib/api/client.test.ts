import { beforeEach, describe, expect, it, vi } from "vitest";

import { shouldRetry } from "@/lib/query/client";
import { jsonResponse } from "@/test/fixtures";

import { ApiError, apiGet } from "./client";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("apiGet", () => {
  it("calls our own API with the given query", async () => {
    fetchMock.mockResolvedValue(jsonResponse([1, 2]));

    await expect(
      apiGet("/api/games", { params: new URLSearchParams({ q: "doom" }) }),
    ).resolves.toEqual([1, 2]);
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/games?q=doom");
  });

  it("turns the BFF error contract into an ApiError", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { error: { code: "RATE_LIMITED", message: "Slow down.", retryAfter: 9 } },
        { status: 429 },
      ),
    );

    const error = await apiGet("/api/games").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: "RATE_LIMITED", status: 429, retryAfter: 9 });
  });

  it("falls back to INTERNAL for responses that are not ours", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    await expect(apiGet("/api/games")).rejects.toMatchObject({ code: "INTERNAL", status: 502 });
  });

  it("reports being offline as NETWORK", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(apiGet("/api/games")).rejects.toMatchObject({ code: "NETWORK" });
  });
});

describe("retry policy", () => {
  it.each(["BAD_REQUEST", "NOT_FOUND", "RATE_LIMITED", "CONFIG_MISSING"] as const)(
    "does not retry %s",
    (code) => {
      expect(shouldRetry(0, new ApiError(code, 400, ""))).toBe(false);
    },
  );

  it("retries transient failures twice", () => {
    const timeout = new ApiError("UPSTREAM_TIMEOUT", 504, "");
    expect(shouldRetry(0, timeout)).toBe(true);
    expect(shouldRetry(1, timeout)).toBe(true);
    expect(shouldRetry(2, timeout)).toBe(false);
  });
});
