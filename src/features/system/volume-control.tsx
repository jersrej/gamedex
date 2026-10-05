"use client";

import { Minus, Plus } from "lucide-react";

import { MAX_VOLUME, stepVolume, useVolume } from "@/lib/audio/sound";
import { cn } from "@/lib/utils";

/**
 * Volume − / + keys on the casing. Each press moves the level one step and
 * brings up the on-screen volume bar; all the way down is mute. The keys stay
 * pressable at either end stop so the bar still appears.
 */
export function VolumeControl({
  compact = false,
  className,
}: {
  /** Handheld: bare keys, no printed read-out underneath. */
  compact?: boolean;
  className?: string;
}) {
  const level = useVolume();
  const key = cn("deck-key text-[#45433f]", compact ? "size-10" : "h-8 w-9");

  return (
    <div
      role="group"
      aria-label="Volume"
      className={cn("flex flex-col items-center gap-1.5", !compact && "p-1", className)}
    >
      <div className="flex gap-1">
        {/* The volume store plays its own tick, at the new level. */}
        <button
          type="button"
          aria-label="Volume down"
          data-sfx="none"
          onClick={() => stepVolume(-1)}
          className={key}
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Volume up"
          data-sfx="none"
          onClick={() => stepVolume(1)}
          className={key}
        >
          <Plus aria-hidden className="size-4" />
        </button>
      </div>

      {compact ? null : (
        <span className="flex flex-col items-center gap-1">
          <span className="printed flex items-center gap-1.5">
            <span aria-hidden className="led" data-on={level > 0} />
            Volume
          </span>
          <span aria-hidden className="printed text-[0.5rem] tracking-[0.12em] opacity-70">
            {level === 0 ? "Mute" : `${level} / ${MAX_VOLUME}`}
          </span>
        </span>
      )}
    </div>
  );
}
