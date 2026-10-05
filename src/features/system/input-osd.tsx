"use client";

import { useEffect, useState } from "react";

import { BOOT_END_EVENT } from "@/features/system/boot";

const VISIBLE_MS = 4000;

/**
 * The television's input read-out: "VIDEO 1 / NTSC" in the top-left corner of
 * the picture for a few seconds after the console has powered on, the way a
 * set announces the source it has just locked on to. It follows every boot
 * sequence (first visit, returning visit, RESET) and nothing else, so it
 * never appears during ordinary browsing — or at all when the boot is skipped
 * for reduced motion.
 *
 * Purely set dressing: it states nothing the visitor needs, so it is hidden
 * from assistive technology.
 */
export function InputOsd() {
  const [shownAt, setShownAt] = useState<number | null>(null);

  useEffect(() => {
    const show = () => setShownAt(Date.now());
    window.addEventListener(BOOT_END_EVENT, show);
    return () => window.removeEventListener(BOOT_END_EVENT, show);
  }, []);

  useEffect(() => {
    if (shownAt === null) return;
    const timer = window.setTimeout(() => setShownAt(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [shownAt]);

  return (
    <div
      aria-hidden
      hidden={shownAt === null}
      className="pointer-events-none fixed top-[calc(var(--deck-top)+1.5rem)] left-[calc(var(--screen-x)+1.5rem)] z-[85] font-mono text-[#6dff92] uppercase [text-shadow:0_0_10px_rgb(61_255_110/0.8),2px_2px_0_rgb(0_0_0/0.9)] sm:top-[calc(var(--deck-top)+2.75rem)] sm:left-[calc(var(--screen-x)+3.25rem)]"
    >
      <p className="text-xl leading-none tracking-[0.2em] sm:text-2xl">Video 1</p>
      <p className="mt-2 text-sm leading-none tracking-[0.3em] sm:text-base">NTSC</p>
    </div>
  );
}
