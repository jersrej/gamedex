"use client";

import { useEffect } from "react";

import { unlockAudio } from "@/lib/audio/engine";
import { sfx } from "@/lib/audio/sound";

const PRESSABLE = "a[href], button, [role='tab'], [role='option'], [cmdk-item]";

/**
 * Interface sounds, wired once at the document level so individual
 * components stay unaware of audio. Presses get a "select" blip unless the
 * element opts into a more specific cue with `data-sfx`, or out with
 * `data-sfx="none"`. Silent while the volume is at zero.
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

    // Browsers keep audio locked until a gesture. Unlock on the first one, so
    // sound — on by default — starts working without the visitor doing anything
    // special. `pointerdown` runs before `click`, so that same click is heard.
    const unlock = () => unlockAudio();
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
