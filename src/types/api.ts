/** Error contract between the BFF and the browser. */

export const API_ERROR_CODES = [
  "BAD_REQUEST",
  "NOT_FOUND",
  "RATE_LIMITED",
  "CONFIG_MISSING",
  "CONFIG_INVALID",
  "UPSTREAM_ERROR",
  "UPSTREAM_TIMEOUT",
  "UPSTREAM_UNREACHABLE",
  "INTERNAL",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Seconds to wait before retrying, when the provider told us. */
    retryAfter?: number;
  };
};
