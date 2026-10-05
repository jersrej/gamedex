"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLibraryEntry } from "@/features/library/hooks";
import {
  LIBRARY_STATUSES,
  STATUS_LABELS,
  setStatus,
  type LibraryGame,
  type LibraryStatus,
} from "@/features/library/store";

const NONE = "none";

export function StatusSelect({
  game,
  className,
}: {
  game: LibraryGame;
  className?: string;
}) {
  const status = useLibraryEntry(game.id)?.status ?? null;

  return (
    <Select
      value={status ?? NONE}
      onValueChange={(value) =>
        setStatus(game, value === NONE ? null : (value as LibraryStatus))
      }
    >
      <SelectTrigger aria-label={`Play status for ${game.title}`} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>No status</SelectItem>
        {LIBRARY_STATUSES.map((value) => (
          <SelectItem key={value} value={value}>
            {STATUS_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
