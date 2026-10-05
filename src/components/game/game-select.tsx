"use client";

import Link from "next/link";
import { useState } from "react";

import { GameArtwork } from "@/components/game/game-artwork";
import { Metascore, PlayerRating } from "@/components/game/rating";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/features/library/favorite-button";
import { archiveNo, formatLongDate, gameHref, platformCode, releaseYear } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { GameSummary } from "@/types/game";

/*
 * Game selection.
 *
 * Games are not shown as tiles. They are records in one list, the way a
 * console of the period would list saves or titles: a slot number, a small
 * picture, the name and a line of system data, with a cursor bar on the
 * record that is selected. Where the list has room beside it (its own
 * container is wide enough — not the viewport), a preview window shows the
 * selected entry large.
 *
 * Selecting is not opening: hover or keyboard focus moves the cursor, and
 * click / Enter opens the entry. The preview repeats what the selected row
 * already says, so it is hidden from assistive technology; every fact is on
 * the row itself.
 *
 * The cursor colours live in globals.css (`.record`), because the same
 * highlight is applied by three different conditions.
 */

function yearOf(game: GameSummary): string {
  return releaseYear(game.releaseDate) ?? (game.tba ? "TBA" : "----");
}

function genresOf(game: GameSummary, max: number): string {
  return game.genres
    .slice(0, max)
    .map((genre) => genre.name)
    .join(" / ");
}

function systemsOf(game: GameSummary): string {
  return game.platforms.map(platformCode).join(" / ");
}

function Record({
  game,
  slot,
  selected,
  onSelect,
  headingLevel: Heading,
}: {
  game: GameSummary;
  slot: number;
  selected: boolean;
  onSelect: () => void;
  headingLevel: "h2" | "h3";
}) {
  const genres = genresOf(game, 2);
  const systems = systemsOf(game);
  const slotLabel = String(slot).padStart(2, "0");

  return (
    <li className="flex items-stretch border-b border-border last:border-b-0">
      <Link
        href={gameHref(game.slug)}
        data-selected={selected}
        // Movement, not entry: when the keyboard scrolls the list under a
        // resting pointer, the pointer must not steal the cursor.
        onMouseMove={selected ? undefined : onSelect}
        onFocus={onSelect}
        className="record flex min-w-0 flex-1 items-center gap-3 p-2 -outline-offset-2 @md:gap-4 @md:pl-3"
      >
        {/* A narrow list has no room for cursor and slot columns; the slot
            number joins the entry line instead. */}
        <span aria-hidden className="record-cursor hidden w-2 shrink-0 text-[0.5rem] @md:block">
          ▶
        </span>
        <span aria-hidden className="label record-dim hidden w-6 shrink-0 tabular-nums @md:block">
          {slotLabel}
        </span>

        <GameArtwork
          src={game.coverImage}
          alt=""
          sizes="(min-width: 40rem) 96px, 112px"
          className="record-art aspect-[4/3] w-20 shrink-0 self-start border border-border-strong @md:w-24 @md:self-center @3xl:w-16"
        />

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span aria-hidden className="label record-dim truncate text-[0.6875rem] leading-none">
            <span className="@md:hidden">{slotLabel} · </span>
            <span className="hidden @md:inline">Entry </span>
            {archiveNo(game.id)}
          </span>
          <Heading className="title line-clamp-2 text-lg @md:text-2xl @3xl:text-xl">
            {game.title}
          </Heading>
          <span className="label record-dim truncate text-xs leading-none">
            <span className="tabular-nums">{yearOf(game)}</span>
            {genres ? ` / ${genres}` : ""}
          </span>
          {systems ? (
            <span className="label record-dim truncate text-xs leading-none @3xl:hidden">
              <span className="sr-only">Available on </span>
              {systems}
            </span>
          ) : null}
          {/* Below the list's own breakpoint the score sits under the name. */}
          <span className="mt-0.5 flex items-center gap-3 @md:hidden">
            {game.rating !== null ? (
              <PlayerRating rating={game.rating} className="text-xs" />
            ) : (
              <span className="label record-dim text-xs">Unrated</span>
            )}
            <Metascore score={game.metascore} />
          </span>
        </span>

        <span className="hidden shrink-0 flex-col items-end gap-1.5 @md:flex">
          {game.rating !== null ? (
            <PlayerRating rating={game.rating} />
          ) : (
            <span className="label record-dim">Unrated</span>
          )}
          <Metascore score={game.metascore} />
        </span>
      </Link>

      <FavoriteButton
        game={game}
        className="h-auto w-10 min-w-10 shrink-0 border-y-0 border-r-0 border-l border-border @md:w-11"
      />
    </li>
  );
}

/** The preview window: the selected entry, large. Decorative duplicate of the row. */
function Preview({ game, preload }: { game: GameSummary; preload: boolean }) {
  const genres = genresOf(game, 3);
  const systems = systemsOf(game);

  return (
    <div
      aria-hidden
      className="sticky top-[calc(var(--deck-top)+1rem)] hidden self-start border border-border-strong @3xl:block"
    >
      <p className="titlebar pixel flex h-8 items-center justify-between gap-3 px-3">
        <span>Selected</span>
        <span className="label">Entry {archiveNo(game.id)}</span>
      </p>

      <GameArtwork
        // Re-keyed so the picture "redraws" when the cursor moves.
        key={game.id}
        src={game.coverImage}
        alt=""
        sizes="(min-width: 64rem) 34vw, 50vw"
        preload={preload}
        className="aspect-[4/3] animate-rise border-b border-border-strong"
      />

      <div className="flex flex-col gap-3 p-4">
        <p className="title text-3xl @5xl:text-4xl">{game.title}</p>
        {genres ? <p className="label text-link">{genres}</p> : null}

        <dl className="label grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-border pt-3">
          <dt className="text-muted-foreground">Release</dt>
          <dd>{game.releaseDate ? formatLongDate(game.releaseDate) : yearOf(game)}</dd>
          {systems ? (
            <>
              <dt className="text-muted-foreground">System</dt>
              <dd>{systems}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Rating</dt>
          <dd>{game.rating !== null ? <PlayerRating rating={game.rating} /> : "Unrated"}</dd>
          {game.metascore !== null ? (
            <>
              <dt className="text-muted-foreground">Metascore</dt>
              <dd>
                <Metascore score={game.metascore} />
              </dd>
            </>
          ) : null}
        </dl>

        <p className="pixel border-t border-border pt-3 text-muted-foreground">
          <span className="text-foreground">▶</span> Select to open entry
        </p>
      </div>
    </div>
  );
}

// The single column is `minmax(0, 1fr)` on purpose: a bare grid track would
// grow to fit the longest title and push the page sideways.
const LAYOUT =
  "grid grid-cols-[minmax(0,1fr)] items-start gap-5 @3xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] @5xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] @5xl:gap-8";

export function GameSelect({
  games,
  startSlot = 1,
  preloadFirst = false,
  headingLevel = "h3",
  className,
}: {
  games: GameSummary[];
  /** Slot number of the first record (pages after the first carry on counting). */
  startSlot?: number;
  /** The first entry is likely above the fold: load its preview eagerly. */
  preloadFirst?: boolean;
  headingLevel?: "h2" | "h3";
  className?: string;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // The cursor always rests somewhere: on the chosen record if it is still in
  // the list, otherwise on the first.
  const selected = games.find((game) => game.id === selectedId) ?? games[0];

  if (!selected) return null;

  return (
    <div className={cn("@container", className)}>
      <div className={LAYOUT}>
        <ol className="min-w-0 border border-border-strong">
          {games.map((game, index) => (
            <Record
              key={game.id}
              game={game}
              slot={startSlot + index}
              selected={game.id === selected.id}
              onSelect={() => setSelectedId(game.id)}
              headingLevel={headingLevel}
            />
          ))}
        </ol>
        <Preview game={selected} preload={preloadFirst} />
      </div>
    </div>
  );
}

/** Blank records with the real list's box model, so nothing moves when data lands. */
export function GameSelectSkeleton({
  count = 8,
  label,
  className,
}: {
  count?: number;
  label: string;
  className?: string;
}) {
  return (
    <div role="status" className={cn("@container", className)}>
      <span className="sr-only">{label}</span>
      <div aria-hidden className={LAYOUT}>
        <div className="border border-border-strong">
          {Array.from({ length: count }, (_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-border py-2 pr-3 pl-10 last:border-b-0"
            >
              <Skeleton className="aspect-[4/3] w-24 shrink-0 @3xl:w-16" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden border border-border-strong @3xl:block">
          <div className="titlebar h-8" />
          <Skeleton className="aspect-[4/3]" />
          <div className="h-40" />
        </div>
      </div>
    </div>
  );
}
