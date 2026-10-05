"use client";

import { useEffect, useState } from "react";

import { MAX_VOLUME, VOLUME_EVENT, useVolume } from "@/lib/audio/sound";
import { cn } from "@/lib/utils";

const VISIBLE_MS = 2000;
/** Two ticks per volume step, as on a television's on-screen display. */
const TICKS = MAX_VOLUME * 2;

/**
 * The television-style volume read-out: green "VOLUME" and a row of ticks
 * that comes up in the corner of the picture when a volume key is pressed and
 * goes away again after two seconds. It is drawn on the display, under the
 * CRT layer, so the tube scans it like everything else. A faint dark plate
 * behind it keeps it readable over whatever the screen is showing.
 */
export function VolumeOsd() {
  const level = useVolume();
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => {
    const show = () => setShownAt(Date.now());
    window.addEventListener(VOLUME_EVENT, show);
    return () => window.removeEventListener(VOLUME_EVENT, show);
  }, []);

  useEffect(() => {
    if (shownAt === null) return;
    const timer = window.setTimeout(() => setShownAt(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [shownAt]);

  const visible = shownAt !== null;

  return (
    <div
      role="status"
      hidden={!visible}
      className={cn(
        "pointer-events-none fixed bottom-[calc(var(--deck-bottom)+1.5rem)] left-[calc(var(--screen-x)+1.25rem)] z-[85] bg-black/65 px-3 py-2.5 font-mono text-[#6dff92] uppercase [text-shadow:0_0_10px_rgb(61_255_110/0.8)] sm:bottom-[calc(var(--deck-bottom)+3.5rem)] sm:left-[calc(var(--screen-x)+3.5rem)] sm:px-4 sm:py-3",
      )}
    >
      {/* Announced once per change; the ticks are a picture of the same number. */}
      <p className="flex items-baseline gap-4 text-xl leading-none tracking-[0.2em] sm:text-2xl">
        <span>{level === 0 ? "Mute" : "Volume"}</span>
        <span className="tabular-nums">
          {String(level).padStart(2, "0")}
          <span className="sr-only"> of {MAX_VOLUME}</span>
        </span>
      </p>
      <div aria-hidden className="mt-2.5 flex h-5 items-center gap-[3px] sm:h-6 sm:gap-1">
        {Array.from({ length: TICKS }, (_, index) => (
          <span
            key={index}
            className={cn(
              "w-1.5 bg-current shadow-[0_0_6px_rgb(61_255_110/0.6)] sm:w-2",
              index < level * 2 ? "h-full" : "h-[3px] opacity-70 shadow-none",
            )}
          />
        ))}
      </div>
    </div>
  );
}
