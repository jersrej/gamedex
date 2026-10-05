"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { GameArtwork } from "@/components/game/game-artwork";
import { PlatformCodes } from "@/components/game/platform-codes";
import { describeError } from "@/components/state/error-panel";
import { LoadingBar } from "@/components/state/loading-bar";
import {
  Command,
  CommandDialog,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SEARCH_MIN_LENGTH, gameQueries } from "@/features/games/api/queries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { archiveNo, gameHref, releaseYear } from "@/lib/format";
import { MAX_SEARCH_LENGTH } from "@/types/game";

const DEBOUNCE_MS = 300;

export function CommandSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [highlighted, setHighlighted] = useState("");

  // Requests follow the debounced term, so typing "elden ring" is one request,
  // not ten. Each settled term is its own cached query.
  const term = useDebouncedValue(input.trim(), DEBOUNCE_MS);
  const searching = term.length >= SEARCH_MIN_LENGTH;
  const { data, error, isFetching, isError, refetch } = useQuery(gameQueries.search(term));

  const go = (href: string) => {
    onOpenChange(false);
    setInput("");
    router.push(href);
  };

  const games = searching ? (data?.items ?? []) : [];
  const waitingForFirstResult = searching && isFetching && games.length === 0;
  const noMatches = searching && !isFetching && !isError && games.length === 0;

  // Results arrive after the list has mounted, so the highlight is controlled:
  // unless the user has moved it onto a row that still exists, it sits on the
  // first row — which is what makes "type, Enter" open the top match.
  const values = searching
    ? games.length > 0
      ? [...games.map((game) => `game-${game.id}`), "all-results"]
      : []
    : ["browse", "library"];
  const active = values.includes(highlighted) ? highlighted : (values[0] ?? "");

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search games"
      description="Type a title, then use the arrow keys and Enter to open a game."
    >
      <p className="titlebar pixel flex h-8 items-center gap-2 px-3">
        GameDex search
        <span className="ml-auto opacity-80">Database query</span>
      </p>

      {/* Results are already filtered by the server; cmdk only handles keys. */}
      <Command
        shouldFilter={false}
        label="Search games"
        value={active}
        onValueChange={setHighlighted}
      >
        <CommandInput
          value={input}
          onValueChange={setInput}
          maxLength={MAX_SEARCH_LENGTH}
          placeholder="Enter game title…"
        />

        <CommandList>
          {waitingForFirstResult ? (
            <LoadingBar label="Searching archive…" className="px-4 py-5" />
          ) : null}

          {searching && isError ? (
            <div role="alert" className="flex flex-col items-start gap-2 px-4 py-5">
              <p className="label text-danger">[Error] {describeError(error).title}</p>
              <p className="text-sm text-muted-foreground">{describeError(error).body}</p>
              {describeError(error).retryable ? (
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="label px-1 text-link underline underline-offset-4 hover:bg-accent hover:text-accent-foreground"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : null}

          {noMatches ? (
            <div className="px-4 py-5">
              <p className="label text-warning">No games found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing matches “{term}”. Check the spelling or try fewer words.
              </p>
            </div>
          ) : null}

          {games.length > 0 ? (
            <CommandGroup heading="Archive records" aria-busy={isFetching}>
              {games.map((game) => (
                <CommandItem
                  key={game.id}
                  value={`game-${game.id}`}
                  onSelect={() => go(gameHref(game.slug))}
                >
                  <GameArtwork
                    src={game.coverImage}
                    alt=""
                    sizes="64px"
                    className="aspect-[16/10] w-14 shrink-0 border-2 border-border-strong"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="title truncate text-xl">{game.title}</span>
                    <span className="label flex items-center gap-2 opacity-80">
                      <span aria-hidden>{archiveNo(game.id)}</span>
                      <span className="tabular-nums">
                        {releaseYear(game.releaseDate) ?? "TBA"}
                      </span>
                      <PlatformCodes platforms={game.platforms} className="truncate text-inherit" />
                    </span>
                  </span>
                </CommandItem>
              ))}
              <CommandItem
                value="all-results"
                onSelect={() => go(`/games?q=${encodeURIComponent(term)}`)}
              >
                <span className="label">See all results for “{term}”</span>
                <span className="label ml-auto tabular-nums opacity-80">
                  {data?.total.toLocaleString("en-US")}
                </span>
              </CommandItem>
            </CommandGroup>
          ) : null}

          {!searching ? (
            <CommandGroup heading="Go to">
              <CommandItem value="browse" onSelect={() => go("/games")}>
                <span className="label">Browse all games</span>
              </CommandItem>
              <CommandItem value="library" onSelect={() => go("/library")}>
                <span className="label">My library</span>
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>

        <p
          aria-hidden
          className="pixel hidden items-center gap-4 border-t-2 border-border-strong bg-surface-elevated px-4 py-2.5 text-muted-foreground sm:flex"
        >
          <span>↑↓ Select</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </p>
      </Command>
    </CommandDialog>
  );
}
