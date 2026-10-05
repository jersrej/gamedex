import { cn } from "@/lib/utils";

const BARS = [
  { color: "var(--danger)", height: "40%" },
  { color: "var(--warning)", height: "60%" },
  { color: "var(--success)", height: "80%" },
  { color: "var(--accent)", height: "100%" },
];

/**
 * The GameDex signature: four upright bars stepping up in height — red,
 * yellow, green, blue — like the edge of an index. It is the only place the
 * software uses all four colours together, and it is always small.
 * Decorative; the name is carried by the wordmark beside it.
 */
export function Signature({
  className,
  animated = false,
}: {
  /** Sets the overall size, e.g. `h-4 w-7`. */
  className?: string;
  /** Boot screen only: the bars grow in one after another. */
  animated?: boolean;
}) {
  return (
    <span aria-hidden className={cn("inline-flex h-4 w-7 items-end gap-[12%]", className)}>
      {BARS.map((bar, index) => (
        <span
          key={bar.color}
          className={cn("flex-1 origin-bottom", animated && "boot-bar")}
          style={
            {
              height: bar.height,
              backgroundColor: bar.color,
              ...(animated ? { "--at": `${0.5 + index * 0.13}s` } : {}),
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  );
}
