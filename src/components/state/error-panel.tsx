"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { StatusPanel } from "@/components/state/status-panel";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { sfx } from "@/lib/audio/sound";

type Copy = { status: string; title: string; body: string; retryable: boolean };

/** Turns a normalised error code into words a player can act on. */
export function describeError(error: unknown): Copy {
  const code = error instanceof ApiError ? error.code : "INTERNAL";

  switch (code) {
    case "CONFIG_MISSING":
    case "CONFIG_INVALID":
      return {
        status: "Setup required",
        title: "Game database not connected",
        // Written by the BFF; safe to show as-is.
        body: (error as ApiError).message,
        retryable: false,
      };
    case "RATE_LIMITED": {
      const wait = (error as ApiError).retryAfter;
      return {
        status: "Rate limited",
        title: "Too many requests",
        body: wait
          ? `The game database is catching its breath. Try again in ${wait} seconds.`
          : "The game database is catching its breath. Try again in a moment.",
        retryable: true,
      };
    }
    case "NOT_FOUND":
      return {
        status: "Not found",
        title: "No such game",
        body: "That entry isn't in the archive. It may have been renamed or removed.",
        retryable: false,
      };
    case "BAD_REQUEST":
      return {
        status: "Invalid request",
        title: "Those filters don't work together",
        body: "Clear the filters and try again.",
        retryable: false,
      };
    case "NETWORK":
      return {
        status: "Offline",
        title: "No connection",
        body: "Check your connection, then try again.",
        retryable: true,
      };
    case "UPSTREAM_TIMEOUT":
      return {
        status: "Timed out",
        title: "Game database is slow to respond",
        body: "The request took too long. Trying again usually works.",
        retryable: true,
      };
    default:
      return {
        status: "Offline",
        title: "Game database offline",
        body: "We couldn't retrieve the games right now.",
        retryable: true,
      };
  }
}

export function ErrorPanel({
  error,
  onRetry,
  isRetrying = false,
  className,
}: {
  error: unknown;
  onRetry?: () => void;
  isRetrying?: boolean;
  className?: string;
}) {
  const copy = describeError(error);

  // One buzz when the fault appears (only if the visitor has sound on).
  useEffect(() => sfx("error"), []);

  return (
    <div role="alert" className={className}>
      <StatusPanel
        status={copy.status}
        tone="danger"
        title={copy.title}
        action={
          copy.retryable && onRetry ? (
            <Button onClick={onRetry} disabled={isRetrying}>
              <RotateCcw aria-hidden />
              {isRetrying ? "Retrying…" : "Retry"}
            </Button>
          ) : null
        }
      >
        {copy.body}
      </StatusPanel>
    </div>
  );
}
