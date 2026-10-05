import { cn } from "@/lib/utils";

/*
 * Symbols printed on the two round console buttons. Both are the standard
 * international symbols (eject; on/standby), drawn here as outlines in the
 * pale blue and green that hardware of the period printed them in.
 */

/** Eject: an upward triangle over a bar. */
export function EjectGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="#9cc8f5"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className={cn("size-6", className)}
    >
      <path d="M12 3.5 20 13H4z" />
      <rect x="4" y="16.5" width="16" height="4" />
    </svg>
  );
}

/** On / standby: "I / ⏻". */
export function PowerGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      aria-hidden
      fill="none"
      stroke="#4fe0bd"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={cn("h-5 w-[1.875rem]", className)}
    >
      <path d="M3 6v12" />
      <path d="M13.5 5 8.5 19" />
      <path d="M25 4.5v7" />
      <path d="M20.6 8.2a7 7 0 1 0 8.8 0" />
    </svg>
  );
}
