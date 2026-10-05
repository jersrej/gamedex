import type { ApiErrorCode } from "@/types/api";

type ErrorSpec = { status: number; message: string };

/**
 * Every failure the BFF can report, with the HTTP status and the exact message
 * the browser receives. Messages never mention the provider, URLs or secrets.
 */
const SPECS: Record<ApiErrorCode, ErrorSpec> = {
  BAD_REQUEST: { status: 400, message: "That request isn't valid." },
  NOT_FOUND: { status: 404, message: "We couldn't find that in the archive." },
  RATE_LIMITED: {
    status: 429,
    message: "The game database is rate limited right now. Try again shortly.",
  },
  CONFIG_MISSING: {
    status: 503,
    message:
      "Game API configuration is missing. Please configure the required server environment variables.",
  },
  CONFIG_INVALID: {
    status: 503,
    message:
      "Game API configuration was rejected. Please check the server environment variables.",
  },
  UPSTREAM_ERROR: {
    status: 502,
    message: "The game database returned an error.",
  },
  UPSTREAM_TIMEOUT: {
    status: 504,
    message: "The game database took too long to respond.",
  },
  UPSTREAM_UNREACHABLE: {
    status: 502,
    message: "The game database can't be reached right now.",
  },
  INTERNAL: { status: 500, message: "Something went wrong on our side." },
};

export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryAfter?: number;

  constructor(
    code: ApiErrorCode,
    options: { message?: string; retryAfter?: number } = {},
  ) {
    super(options.message ?? SPECS[code].message);
    this.name = "AppError";
    this.code = code;
    this.status = SPECS[code].status;
    this.retryAfter = options.retryAfter;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
