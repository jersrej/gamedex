"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { catalogQueries } from "@/features/catalog/queries";
import type { LockedFilters } from "@/features/games/hooks/use-game-filters";
import { maxReleaseYear } from "@/lib/games/filters";
import { cn } from "@/lib/utils";
import {
  GAME_SORTS,
  MIN_SCORES,
  type GameFilters,
  type GameSort,
  type MinScore,
} from "@/types/game";

const ANY = "any";
const OLDEST_YEAR_OFFERED = 1985;

export const SORT_LABELS: Record<GameSort, string> = {
  relevance: "Relevance",
  popularity: "Popularity",
  rating: "Player rating",
  metascore: "Metascore",
  released: "Newest",
  name: "Name A–Z",
};

function years(): number[] {
  const newest = maxReleaseYear() - 1;
  return Array.from({ length: newest - OLDEST_YEAR_OFFERED + 1 }, (_, i) => newest - i);
}

type Option = { value: string; label: string };

function FilterSelect({
  label,
  value,
  anyLabel,
  options,
  onChange,
  stacked,
}: {
  label: string;
  value: string | undefined;
  /** Omit for selects that always have a value (sort). */
  anyLabel?: string;
  options: Option[];
  onChange: (value: string | undefined) => void;
  stacked: boolean;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", !stacked && "w-44")}>
      <span aria-hidden className="pixel text-muted-foreground">
        {label}
      </span>
      <Select
        value={value ?? ANY}
        onValueChange={(next) => onChange(next === ANY ? undefined : next)}
      >
        <SelectTrigger
          aria-label={label}
          data-filled={value !== undefined && anyLabel !== undefined}
          className="w-full data-[filled=true]:border-accent data-[filled=true]:bg-accent data-[filled=true]:text-accent-foreground data-[filled=true]:[&_svg]:text-accent-foreground!"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          {anyLabel ? <SelectItem value={ANY}>{anyLabel}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * The filter selects. Rendered inline on wide screens and stacked inside a
 * bottom sheet on phones — same controls, same URL state.
 */
export function FilterControls({
  filters,
  locked,
  onChange,
  layout,
}: {
  filters: GameFilters;
  locked: LockedFilters;
  onChange: (change: Partial<GameFilters>) => void;
  layout: "inline" | "stacked";
}) {
  const genres = useQuery(catalogQueries.genres());
  const platforms = useQuery(catalogQueries.platforms());
  const stacked = layout === "stacked";

  return (
    <div className={cn(stacked ? "grid gap-4" : "flex flex-wrap gap-2")}>
      {locked.genre ? null : (
        <FilterSelect
          label="Genre"
          anyLabel="Any genre"
          value={filters.genre}
          stacked={stacked}
          options={(genres.data ?? []).map((g) => ({ value: g.slug, label: g.name }))}
          onChange={(genre) => onChange({ genre })}
        />
      )}
      {locked.platform ? null : (
        <FilterSelect
          label="Platform"
          anyLabel="Any platform"
          value={filters.platform}
          stacked={stacked}
          options={(platforms.data ?? []).map((p) => ({ value: p.slug, label: p.name }))}
          onChange={(platform) => onChange({ platform })}
        />
      )}
      <FilterSelect
        label="Release year"
        anyLabel="Any year"
        value={filters.year?.toString()}
        stacked={stacked}
        options={years().map((year) => ({ value: String(year), label: String(year) }))}
        onChange={(year) => onChange({ year: year ? Number(year) : undefined })}
      />
      <FilterSelect
        label="Metascore"
        anyLabel="Any score"
        value={filters.score?.toString()}
        stacked={stacked}
        options={MIN_SCORES.map((score) => ({
          value: String(score),
          label: `${score}+ Metascore`,
        }))}
        onChange={(score) =>
          onChange({ score: score ? (Number(score) as MinScore) : undefined })
        }
      />
    </div>
  );
}

export function SortSelect({
  sort,
  onChange,
}: {
  sort: GameSort;
  onChange: (sort: GameSort) => void;
}) {
  return (
    <FilterSelect
      label="Sort by"
      value={sort}
      stacked={false}
      options={GAME_SORTS.map((value) => ({ value, label: SORT_LABELS[value] }))}
      onChange={(value) => onChange((value ?? "relevance") as GameSort)}
    />
  );
}
