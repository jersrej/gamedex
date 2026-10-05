import "server-only";

import { NextResponse } from "next/server";

import { cacheControl } from "@/server/cache";
import { AppError, isAppError } from "@/server/errors";
import { isSlug } from "@/lib/games/filters";
import type { ApiErrorBody } from "@/types/api";

function errorResponse(error: AppError): NextResponse<ApiErrorBody> {
  const headers = new Headers({ "Cache-Control": "no-store" });
  if (error.retryAfter) headers.set("Retry-After", String(error.retryAfter));

  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.retryAfter ? { retryAfter: error.retryAfter } : {}),
      },
    },
    { status: error.status, headers },
  );
}

/**
 * Wraps a Route Handler body: successful results become cacheable JSON, and
 * anything thrown becomes the normalised error contract. Unknown errors are
 * logged server-side and reported as a generic INTERNAL — never passed through.
 */
export async function respond<T>(
  work: () => Promise<T>,
  options: { cacheSeconds: number | null },
): Promise<NextResponse<T | ApiErrorBody>> {
  try {
    const data = await work();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          options.cacheSeconds === null ? "no-store" : cacheControl(options.cacheSeconds),
      },
    });
  } catch (error) {
    if (isAppError(error)) return errorResponse(error);
    console.error("[bff] unexpected error", error);
    return errorResponse(new AppError("INTERNAL"));
  }
}

/** Path segments are interpolated into upstream paths, so they must be plain slugs. */
export function requireSlug(value: string): string {
  if (!isSlug(value)) throw new AppError("NOT_FOUND");
  return value;
}
