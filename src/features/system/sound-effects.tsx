"use client";

import { useEffect } from "react";

import { sfx } from "@/lib/audio/sound";

const PRESSABLE = "a[href], button, [role='tab'], [role='option'], [cmdk-item]";

/**
 * Interface sounds, wired once at the document level so individual
 * components stay unaware of audio. Presses get a "select" blip unless the
 * element opts into a more specific cue with `data-sfx`, or out with
 * `data-sfx="none"`. Does nothing at all while sound is off.
 */
export function SoundEffects() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = (event.target as Element | null)?.closest?.(PRESSABLE);
      if (!target || target.hasAttribute("disabled")) return;
      if (target.getAttribute("aria-disabled") === "true") return;

      const cue = target.getAttribute("data-sfx");
      if (cue === "none") return;
      sfx(cue === "open" || cue === "close" || cue === "confirm" || cue === "disc" ? cue : "select");
    };

    // Moving through menus with the keyboard ticks, like a D-pad.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.startsWith("Arrow") && !event.repeat) sfx("move");
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
