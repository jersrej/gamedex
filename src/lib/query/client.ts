import { QueryClient, isServer } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { STALE } from "@/lib/query/stale-times";

/** Failures that will not fix themselves on a second attempt. */
const NO_RETRY: ReadonlySet<ApiError["code"]> = new Set([
  "BAD_REQUEST",
  "NOT_FOUND",
  "RATE_LIMITED",
  "CONFIG_MISSING",
  "CONFIG_INVALID",
]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && NO_RETRY.has(error.code)) return false;
  return failureCount < 2;
}

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE.list,
        gcTime: 15 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserClient: QueryClient | undefined;

/** A fresh client per server request; a single shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}
