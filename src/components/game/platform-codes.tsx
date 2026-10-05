import { platformCode } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Platform } from "@/types/game";

const MAX_VISIBLE = 4;

/** Compact platform line for cards: "PC · PS · XBOX +2". */
export function PlatformCodes({
  platforms,
  className,
}: {
  platforms: Platform[];
  className?: string;
}) {
  if (platforms.length === 0) return null;
  const visible = platforms.slice(0, MAX_VISIBLE);
  const hidden = platforms.length - visible.length;

  return (
    <span className={cn("label text-muted-foreground", className)}>
      <span className="sr-only">
        Available on {platforms.map((platform) => platform.name).join(", ")}
      </span>
      <span aria-hidden>
        {visible.map(platformCode).join(" · ")}
        {hidden > 0 ? ` +${hidden}` : ""}
      </span>
    </span>
  );
}
