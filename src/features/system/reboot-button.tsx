"use client";

import { RotateCcw } from "lucide-react";

import { PowerGlyph } from "@/components/console/glyphs";

import { DeckControl } from "@/components/console/deck-control";
import { replayBoot } from "@/features/system/boot";

/** The console's round RESET button: restarts the unit, replaying the power-on sequence. */
export function ResetControl({ className }: { className?: string }) {
  return (
    <DeckControl
      label="Reset"
      hint="Restart"
      round
      aria-label="Replay boot sequence"
      data-sfx="none"
      onClick={replayBoot}
      className={className}
    >
      <PowerGlyph />
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
