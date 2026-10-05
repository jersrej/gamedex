"use client";

import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import { useLibrary } from "@/features/library/hooks";
import { cn } from "@/lib/utils";

/**
 * The console's three indicator lamps. Each one reports something real:
 * POWER is on while the app runs, DISC flickers while data is being read
 * from the archive, and MEMORY lights when the memory card holds anything.
 */
export function Leds({ className }: { className?: string }) {
  const reading = useIsFetching() + useIsMutating() > 0;
  const saved = useLibrary().length > 0;

  const lamps = [
    { label: "Power", on: true, color: "var(--success)", extra: "led-power" },
    { label: "Disc", on: reading, color: "var(--warning)", blink: reading },
    { label: "Memory", on: saved, color: "var(--danger)" },
  ];

  return (
    // Decorative read-outs; the same facts are available as text elsewhere.
    <ul aria-hidden className={cn("flex items-center gap-3", className)}>
      {lamps.map((lamp) => (
        <li key={lamp.label} className="flex flex-col items-center gap-1.5">
          <span
            className={cn("led", lamp.extra)}
            data-on={lamp.on}
            data-blink={lamp.blink ?? false}
            style={{ "--led": lamp.color } as React.CSSProperties}
          />
          <span className="printed hidden text-[0.5625rem] sm:block">{lamp.label}</span>
        </li>
      ))}
    </ul>
  );
}
