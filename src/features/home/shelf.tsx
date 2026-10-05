"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { GameSelectSkeleton } from "@/components/game/game-select";
import { SectionHeading } from "@/components/layout/section-heading";
import { describeError } from "@/components/state/error-panel";
import { gameQueries, type ShelfName } from "@/features/games/api/queries";
import type { GameSummary } from "@/types/game";

/**
 * One pane of the home menu, backed by one query. Handles its own loading,
 * failure and empty cases, so one broken list never takes the menu down.
 */
export function Shelf({
  id,
  title,
  note,
  href,
  hrefLabel,
  shelf,
  select,
  skeletonCount,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  href?: string;
  hrefLabel?: string;
  shelf: ShelfName;
  select?: (games: GameSummary[]) => GameSummary[];
  skeletonCount: number;
  children: (games: GameSummary[]) => ReactNode;
}) {
  const { data, error, isPending, isError, isRefetching, refetch } = useQuery(
    gameQueries.shelf(shelf),
  );
  const games = data ? (select ? select(data) : data) : [];

  return (
    <section aria-labelledby={id}>
      <SectionHeading id={id} title={title} note={note} href={href} hrefLabel={hrefLabel} />

      {isPending ? (
        <GameSelectSkeleton count={skeletonCount} label={`Loading ${title}…`} />
      ) : null}

      {isError ? (
        <p role="alert" className="label flex flex-wrap items-center gap-3 text-muted-foreground">
          <span className="text-danger">[{describeError(error).status}]</span>
          Couldn’t load this shelf.
          {describeError(error).retryable ? (
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="px-1 text-link underline underline-offset-4 hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            >
              {isRefetching ? "Retrying…" : "Retry"}
            </button>
          ) : null}
        </p>
      ) : null}

      {/* A menu entry always leads somewhere: an empty list says that it is empty. */}
      {data && games.length === 0 ? (
        <p className="panel label p-4 text-muted-foreground">
          No entries in this list right now.
        </p>
      ) : null}

      {games.length > 0 ? children(games) : null}
    </section>
  );
}
