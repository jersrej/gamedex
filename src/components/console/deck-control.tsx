import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * A front-panel button: a moulded key — rectangular, or a round cap for the
 * two main console buttons — with its function printed underneath. Always a real <button> with an accessible name — the hardware
 * look never replaces the label.
 */
export function DeckControl({
  label,
  hint,
  led,
  down = false,
  round = false,
  children,
  className,
  ...props
}: {
  /** Printed under the key. Give `aria-label` too when the action needs plainer words. */
  label: string;
  /** Smaller second line: what the key does. */
  hint?: ReactNode;
  /** Shows a lamp beside the label; lit when true. */
  led?: boolean;
  /** Draws the key held down (busy). */
  down?: boolean;
  /** A round cap instead of the rectangular key (open and reset only). */
  round?: boolean;
} & ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn("group flex flex-col items-center gap-1.5 p-1", className)}
      {...props}
    >
      <span
        data-down={down}
        className={
          round
            ? "deck-key-round size-10 md:size-11"
            : "deck-key size-10 text-[#45433f] md:h-8 md:w-14"
        }
      >
        {children}
      </span>
      <span className="hidden flex-col items-center gap-1 md:flex">
        <span className="printed flex items-center gap-1.5">
          {led === undefined ? null : <span aria-hidden className="led" data-on={led} />}
          {label}
        </span>
        {hint ? (
          <span className="printed text-[0.5rem] tracking-[0.12em] opacity-70">{hint}</span>
        ) : null}
      </span>
    </button>
  );
}
