import { formatRating } from "@/lib/format";
import { cn } from "@/lib/utils";

const CELLS = [0, 1, 2, 3, 4];

/**
 * Player rating as a five-cell diagnostic read-out: ■■■■□ 4.3. Each cell is
 * an outlined box that fills by the share it has earned. Drawn in the current
 * text colour, so it inverts with a selected row.
 */
export function PlayerRating({
  rating,
  className,
}: {
  rating: number | null;
  className?: string;
}) {
  if (rating === null) return null;

  return (
    <span className={cn("inline-flex items-center gap-2 font-mono text-sm", className)}>
      <span className="sr-only">Player rating</span>
      <span aria-hidden className="flex gap-[3px]">
        {CELLS.map((cell) => {
          const fill = Math.max(0, Math.min(1, rating - cell));
          return (
            <span key={cell} className="size-2 shadow-[inset_0_0_0_1px_currentColor]">
              <span className="block h-full bg-current" style={{ width: `${fill * 100}%` }} />
            </span>
          );
        })}
      </span>
      <span className="tabular-nums">{formatRating(rating)}</span>
      <span className="sr-only">out of 5</span>
    </span>
  );
}

function scoreTone(score: number): string {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-danger";
}

/** Metascore as a lit tag. The number carries the meaning; the colour only echoes it. */
export function Metascore({
  score,
  className,
}: {
  score: number | null;
  className?: string;
}) {
  if (score === null) return null;
  return (
    <span
      className={cn(
        "inline-grid h-5 min-w-7 place-items-center px-1 font-mono text-sm leading-none font-bold text-background tabular-nums",
        scoreTone(score),
        className,
      )}
    >
      <span className="sr-only">Metascore </span>
      {score}
    </span>
  );
}
