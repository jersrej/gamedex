"use client";

import { useQuery } from "@tanstack/react-query";
import { useId, useState } from "react";

import { GameArtwork } from "@/components/game/game-artwork";
import { describeError } from "@/components/state/error-panel";
import { LoadingBar } from "@/components/state/loading-bar";
import { SEARCH_MIN_LENGTH, gameQueries } from "@/features/games/api/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { releaseYear } from "@/lib/format";
import { MAX_SEARCH_LENGTH } from "@/types/game";

/** Inline title search for filling a comparison slot. Shares its cache with the command palette. */
export function GamePicker({
  label,
  excludeSlug,
  onPick,
}: {
  label: string;
  excludeSlug?: string;
  onPick: (slug: string) => void;
}) {
  const inputId = useId();
  const [input, setInput] = useState("");
  const term = useDebouncedValue(input.trim(), 300);
  const searching = term.length >= SEARCH_MIN_LENGTH;
  const { data, error, isFetching, isError } = useQuery(gameQueries.search(term));

  const games = searching
    ? (data?.items ?? []).filter((game) => game.slug !== excludeSlug)
    : [];

  return (
    <div className="panel flex h-full flex-col gap-3 p-3 sm:p-4">
      <label htmlFor={inputId} className="pixel text-muted-foreground">
        {label}
      </label>
      <input
        id={inputId}
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Search by title…"
        className="well h-10 w-full min-w-0 border border-border-strong px-3 font-mono text-base tracking-wide uppercase caret-accent placeholder:text-muted-foreground hover:border-accent sm:text-sm"
      />

      {searching && isFetching && games.length === 0 ? (
        <LoadingBar label="Searching…" />
      ) : null}

      {searching && isError ? (
        <p role="alert" className="text-sm text-danger">
          {describeError(error).body}
        </p>
      ) : null}

      {searching && !isFetching && !isError && games.length === 0 ? (
        <p className="text-sm text-muted-foreground">No games match “{term}”.</p>
      ) : null}

      {games.length > 0 ? (
        <ul aria-label="Search results">
          {games.map((game) => (
            <li key={game.id}>
              <button
                type="button"
                onClick={() => onPick(game.slug)}
                className="group flex min-h-11 w-full items-center gap-3 px-1.5 py-1.5 text-left text-sm -outline-offset-2 hover:bg-accent hover:text-accent-foreground"
              >
                <GameArtwork
                  src={game.coverImage}
                  alt=""
                  sizes="56px"
                  className="hidden aspect-[16/10] w-14 shrink-0 border border-border-strong sm:block"
                />
                <span className="min-w-0 flex-1 truncate">{game.title}</span>
                <span className="label text-muted-foreground tabular-nums group-hover:text-accent-foreground">
                  {releaseYear(game.releaseDate) ?? "TBA"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
