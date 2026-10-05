import { API_ERROR_CODES, type ApiErrorBody, type ApiErrorCode } from "@/types/api";

/** A failed BFF call, carrying the normalised code so the UI can react to it. */
export class ApiError extends Error {
  readonly code: ApiErrorCode | "NETWORK";
  readonly status: number;
  readonly retryAfter?: number;

  constructor(
    code: ApiErrorCode | "NETWORK",
    status: number,
    message: string,
    retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

function isErrorBody(body: unknown): body is ApiErrorBody {
  if (typeof body !== "object" || body === null || !("error" in body)) return false;
  const { error } = body as { error: unknown };
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (API_ERROR_CODES as readonly unknown[]).includes(error.code)
  );
}

/**
 * The browser's only way to get game data: a GET against our own `/api`.
 * It knows nothing about the provider behind it.
 */
export async function apiGet<T>(
  path: `/api/${string}`,
  options: { params?: URLSearchParams; signal?: AbortSignal } = {},
): Promise<T> {
  const query = options.params?.toString();
  const url = query ? `${path}?${query}` : path;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
  } catch (cause) {
    // Let TanStack Query's own cancellation pass through untouched.
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError("NETWORK", 0, "You appear to be offline.");
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    if (isErrorBody(body)) {
      const { code, message, retryAfter } = body.error;
      throw new ApiError(code, response.status, message, retryAfter);
    }
    throw new ApiError("INTERNAL", response.status, "Something went wrong on our side.");
  }

  return body as T;
}
