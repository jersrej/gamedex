"use client";

import { useMutationState } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";

import { RANDOM_MUTATION_KEY } from "@/features/surprise/surprise-button";
import { useLibrary } from "@/features/library/hooks";
import { cn } from "@/lib/utils";

function subscribeToClock(onTick: () => void): () => void {
  const timer = window.setInterval(onTick, 15_000);
  return () => window.clearInterval(timer);
}

function clock(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/**
 * The little LCD on the casing. Normally shows memory blocks in use and the
 * local time; while a random disc is being read it reports on the drive.
 */
export function Lcd({ className }: { className?: string }) {
  // Blank on the server, so hydration never disagrees about the time.
  const time = useSyncExternalStore(subscribeToClock, clock, () => "--:--");
  const saved = useLibrary().length;
  const drive = useMutationState({
    filters: { mutationKey: RANDOM_MUTATION_KEY },
    select: (mutation) => mutation.state.status,
  }).at(-1);

  const message =
    drive === "pending" ? "READING DISC" : drive === "error" ? "DISC READ ERR" : null;

  return (
    <p
      className={cn(
        "lcd flex h-8 w-44 items-center justify-between gap-3 px-2.5 text-sm tracking-wider tabular-nums",
        className,
      )}
    >
      {message ? (
        <span aria-hidden>{message}</span>
      ) : (
        <>
          <span>
            <span aria-hidden>MEM </span>
            <span className="sr-only">Memory card blocks used: </span>
            {String(saved).padStart(2, "0")}
          </span>
          <span>
            <span className="sr-only">Local time </span>
            {time}
          </span>
        </>
      )}
    </p>
  );
}
