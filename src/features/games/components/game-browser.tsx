"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { GameSelect, GameSelectSkeleton } from "@/components/game/game-select";
import { ErrorPanel } from "@/components/state/error-panel";
import { StatusPanel } from "@/components/state/status-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { catalogQueries } from "@/features/catalog/queries";
import { gameQueries } from "@/features/games/api/queries";
import {
  FilterControls,
  SortSelect,
} from "@/features/games/components/filter-controls";
import { Pagination } from "@/features/games/components/pagination";
import { SearchField } from "@/features/games/components/search-field";
import {
  useGameFilters,
  type LockedFilters,
} from "@/features/games/hooks/use-game-filters";
import { MAX_PAGE, countActiveFilters } from "@/lib/games/filters";
import { cn } from "@/lib/utils";
import { DEFAULT_PAGE_SIZE, type GameFilters } from "@/types/game";

type Chip = { key: string; label: string; clear: Partial<GameFilters> };

function useFilterChips(filters: GameFilters, locked: LockedFilters): Chip[] {
  const genres = useQuery(catalogQueries.genres());
  const platforms = useQuery(catalogQueries.platforms());
  const chips: Chip[] = [];

  if (filters.genre && !locked.genre) {
    const name = genres.data?.find((g) => g.slug === filters.genre)?.name;
    chips.push({ key: "genre", label: name ?? filters.genre, clear: { genre: undefined } });
  }
  if (filters.platform && !locked.platform) {
    const name = platforms.data?.find((p) => p.slug === filters.platform)?.name;
    chips.push({
      key: "platform",
      label: name ?? filters.platform,
      clear: { platform: undefined },
    });
  }
  if (filters.year) {
    chips.push({ key: "year", label: String(filters.year), clear: { year: undefined } });
  }
  if (filters.score) {
    chips.push({
      key: "score",
      label: `${filters.score}+ Metascore`,
      clear: { score: undefined },
    });
  }
  return chips;
}

/**
 * Search, filter, sort and page through the archive. All of it is driven by
 * the URL; this component only translates between the URL and the controls.
 */
export function GameBrowser({ locked = {} }: { locked?: LockedFilters }) {
  const { filters, setFilters, hrefFor } = useGameFilters(locked);
  const queryClient = useQueryClient();
  const query = useQuery(gameQueries.list(filters));
  const { data, error, isPending, isError, isPlaceholderData, isRefetching } = query;

  const chips = useFilterChips(filters, locked);
  const activeCount = countActiveFilters({
    ...filters,
    genre: locked.genre ? undefined : filters.genre,
    platform: locked.platform ? undefined : filters.platform,
  });
  const hasCriteria = activeCount > 0 || Boolean(filters.q);
  const clearAll = () =>
    setFilters({ q: undefined, genre: undefined, platform: undefined, year: undefined, score: undefined });

  // Warm the next page while the current one is being read.
  const hasNextPage = Boolean(data?.hasNextPage) && filters.page < MAX_PAGE;
  useEffect(() => {
    if (hasNextPage && !isPlaceholderData) {
      void queryClient.prefetchQuery(
        gameQueries.list({ ...filters, page: filters.page + 1 }),
      );
    }
  }, [filters, hasNextPage, isPlaceholderData, queryClient]);

  // Paging keeps your place in the controls but brings the results back to the top.
  const top = useRef<HTMLDivElement>(null);
  const lastPage = useRef(filters.page);
  useEffect(() => {
    if (lastPage.current !== filters.page) {
      lastPage.current = filters.page;
      top.current?.scrollIntoView({ block: "start" });
    }
  }, [filters.page]);

  const totalPages = data
    ? Math.min(MAX_PAGE, Math.max(1, Math.ceil(data.total / DEFAULT_PAGE_SIZE)))
    : 1;

  return (
    <div ref={top} className="scroll-mt-[calc(var(--deck-top)+1rem)]">
      <section aria-label="Filter database" className="panel">
        <p className="titlebar pixel flex h-8 items-center gap-2 px-3">
          Database filter
          <span className="ml-auto opacity-80">Search · Sort</span>
        </p>

        <div className="flex flex-col gap-3 p-3 sm:p-4">
          <div className="flex gap-2">
            <SearchField
              value={filters.q ?? ""}
              onCommit={(term) => setFilters({ q: term || undefined }, { replace: true })}
            />

            {/* Handhelds: filters move into a bottom sheet. */}
            <Sheet>
              <SheetTrigger asChild>
                <Button data-sfx="open" className="lg:hidden">
                  <SlidersHorizontal aria-hidden />
                  Filters
                  {activeCount > 0 ? (
                    <span className="grid size-5 place-items-center bg-accent font-mono text-sm text-accent-foreground">
                      <span className="sr-only">Active filters:</span> {activeCount}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="title text-3xl">Filters</SheetTitle>
                  <SheetDescription>Results update as you choose.</SheetDescription>
                </SheetHeader>
                <div className="px-4">
                  <FilterControls
                    filters={filters}
                    locked={locked}
                    onChange={setFilters}
                    layout="stacked"
                  />
                </div>
                <SheetFooter className="flex-row">
                  <Button
                    variant="outline"
                    onClick={clearAll}
                    disabled={!hasCriteria}
                    className="flex-1"
                  >
                    Clear all
                  </Button>
                  <SheetClose asChild>
                    <Button data-sfx="close" className="flex-1">
                      {data ? `Show ${data.total.toLocaleString("en-US")} games` : "Show games"}
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-3">
            <div className="hidden lg:block">
              <FilterControls
                filters={filters}
                locked={locked}
                onChange={setFilters}
                layout="inline"
              />
            </div>
            <div className="ml-auto">
              <SortSelect sort={filters.sort} onChange={(sort) => setFilters({ sort })} />
            </div>
          </div>
        </div>

        <div className="flex min-h-12 flex-wrap items-center gap-2 border-t border-border-strong bg-background px-3 py-2 sm:px-4">
          <p
            role="status"
            className={cn("label mr-2 tabular-nums", isError ? "text-danger" : "text-foreground")}
          >
            {data
              ? `${data.total.toLocaleString("en-US")} ${data.total === 1 ? "game" : "games"}`
              : isError
                ? "Unavailable"
                : "Searching…"}
          </p>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilters(chip.clear)}
              aria-label={`Remove filter: ${chip.label}`}
              className="label flex h-8 items-center gap-1.5 border-2 border-accent bg-accent px-2 text-accent-foreground hover:bg-transparent hover:text-link"
            >
              {chip.label}
              <X aria-hidden className="size-3" />
            </button>
          ))}
          {hasCriteria ? (
            <button
              type="button"
              onClick={clearAll}
              className="label h-8 px-2 text-muted-foreground underline underline-offset-4 hover:bg-accent hover:text-accent-foreground"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </section>

      <div className="mt-6">
        {isPending ? <GameSelectSkeleton count={12} label="Loading games…" /> : null}

        {isError ? (
          <ErrorPanel
            error={error}
            onRetry={() => query.refetch()}
            isRetrying={isRefetching}
          />
        ) : null}

        {data && data.items.length === 0 ? (
          <StatusPanel
            status="0 results"
            title="No games found"
            action={
              hasCriteria ? (
                <Button onClick={clearAll}>Clear search and filters</Button>
              ) : null
            }
          >
            {filters.q
              ? `Nothing matches “${filters.q}” with these filters. Try another title or remove a filter.`
              : "No games match this combination. Remove a filter to widen the search."}
          </StatusPanel>
        ) : null}

        {data && data.items.length > 0 ? (
          <>
            <GameSelect
              games={data.items}
              startSlot={(filters.page - 1) * DEFAULT_PAGE_SIZE + 1}
              preloadFirst
              headingLevel="h2"
              // Dimmed while the previous page stands in for the one being fetched.
              className={cn(isPlaceholderData && "opacity-50")}
            />
            <Pagination
              page={filters.page}
              totalPages={totalPages}
              hasNextPage={hasNextPage}
              hrefForPage={(page) => hrefFor({ ...filters, page })}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
