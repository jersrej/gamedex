"use client";

import { RotateCcw } from "lucide-react";

import { DeckControl } from "@/components/console/deck-control";
import { replayBoot } from "@/features/system/boot";

/** The console's RESET key: replays the power-on sequence (with sound, if on). */
export function ResetControl({ className }: { className?: string }) {
  return (
    <DeckControl
      label="Reset"
      hint="Replay boot"
      aria-label="Replay boot sequence"
      data-sfx="none"
      onClick={replayBoot}
      className={className}
    >
      <RotateCcw aria-hidden className="size-4" />
    </DeckControl>
  );
}

/** Handheld version: a small printed control on the lower edge of the casing. */
export function ResetLink() {
  return (
    <button
      type="button"
      data-sfx="none"
      onClick={replayBoot}
      aria-label="Replay boot sequence"
      className="printed flex h-10 min-w-10 items-center justify-end gap-1 text-[0.5625rem] underline underline-offset-2"
    >
      <RotateCcw aria-hidden className="size-3" />
      Reset
    </button>
  );
}
