import "server-only";

import { AppError } from "@/server/errors";

const DEFAULT_BASE_URL = "https://api.rawg.io/api";
const TIMEOUT_MS = 8_000;

type Primitive = string | number | boolean;
export type RawgParams = Record<string, Primitive | undefined>;

function readConfig(): { baseUrl: string; key: string } {
  const key = process.env.GAME_API_KEY?.trim();
  if (!key) throw new AppError("CONFIG_MISSING");
  const baseUrl = (process.env.GAME_API_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(
    /\/+$/,
    "",
  );
  return { baseUrl, key };
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : undefined;
}

function errorForStatus(response: Response): AppError {
  switch (response.status) {
    case 400:
      return new AppError("BAD_REQUEST");
    case 401:
    case 403:
      return new AppError("CONFIG_INVALID");
    case 404:
      return new AppError("NOT_FOUND");
    case 429:
      return new AppError("RATE_LIMITED", {
        retryAfter: parseRetryAfter(response.headers.get("retry-after")),
      });
    default:
      return new AppError("UPSTREAM_ERROR");
  }
}

/**
 * The single place that talks to the provider. Owns the base URL, the key,
 * the timeout and the translation of upstream failures into `AppError`s.
 *
 * `path` is always a literal chosen by our own service code — callers pass
 * structured params, never URLs, so the browser can't steer upstream requests.
 */
export async function rawgFetch<T>(
  path: string,
  params: RawgParams,
  revalidate: number,
): Promise<T> {
  const { baseUrl, key } = readConfig();

  const url = new URL(`${baseUrl}${path}`);
  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(name, String(value));
  }
  url.searchParams.sort();
  url.searchParams.set("key", key);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate },
    });
  } catch (cause) {
    // Read `name` structurally: a DOMException isn't always `instanceof Error`.
    const name = (cause as { name?: unknown } | null)?.name;
    const code =
      name === "TimeoutError" || name === "AbortError"
        ? "UPSTREAM_TIMEOUT"
        : "UPSTREAM_UNREACHABLE";
    // Log the path only: the full URL carries the key.
    console.error(`[game-api] ${code} ${path}`);
    throw new AppError(code);
  }

  if (!response.ok) {
    const error = errorForStatus(response);
    if (error.code !== "NOT_FOUND") {
      console.error(`[game-api] ${error.code} (${response.status}) ${path}`);
    }
    throw error;
  }

  try {
    return (await response.json()) as T;
  } catch {
    console.error(`[game-api] UPSTREAM_ERROR (unreadable body) ${path}`);
    throw new AppError("UPSTREAM_ERROR");
  }
}
