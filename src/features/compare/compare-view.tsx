"use client";

import { useQueries } from "@tanstack/react-query";
import { X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { GameArtwork } from "@/components/game/game-artwork";
import { describeError } from "@/components/state/error-panel";
import { LoadingBar } from "@/components/state/loading-bar";
import { Button } from "@/components/ui/button";
import { GamePicker } from "@/features/compare/game-picker";
import { gameQueries } from "@/features/games/api/queries";
import { formatRating, gameHref, releaseLabel } from "@/lib/format";
import { isSlug } from "@/lib/games/filters";
import { cn } from "@/lib/utils";
import type { GameDetail } from "@/types/game";

type SlotKey = "a" | "b";

type Row = {
  label: string;
  value: (game: GameDetail) => ReactNode;
  /** For rows where a bigger number is plainly better, so the lead can be marked. */
  score?: (game: GameDetail) => number | null;
  /** Top of the scale, for the segmented gauge. */
  max?: number;
};

const SEGMENTS = 10;

/** A ten-segment gauge, filled from the centre line outwards. */
function Gauge({ value, max, side }: { value: number; max: number; side: "a" | "b" }) {
  const lit = Math.round((value / max) * SEGMENTS);

  return (
    <span
      aria-hidden
      className={cn("mt-1.5 flex gap-0.5", side === "a" ? "flex-row-reverse" : "flex-row")}
    >
      {Array.from({ length: SEGMENTS }, (_, index) => (
        <span
          key={index}
          className={cn("h-2 flex-1 max-w-3", index < lit ? "bg-current" : "bg-current/20")}
        />
      ))}
    </span>
  );
}

const names = (items: { name: string }[]) =>
  items.length > 0 ? items.map((item) => item.name).join(", ") : null;

const ROWS: Row[] = [
  { label: "Release", value: (game) => releaseLabel(game) },
  {
    label: "Player rating",
    value: (game) => (game.rating !== null ? `${formatRating(game.rating)} / 5` : null),
    score: (game) => game.rating,
    max: 5,
  },
  {
    label: "Metascore",
    value: (game) => game.metascore,
    score: (game) => game.metascore,
    max: 100,
  },
  { label: "Avg. playtime", value: (game) => (game.playtime ? `${game.playtime} h` : null) },
  { label: "Genres", value: (game) => names(game.genres) },
  { label: "Platforms", value: (game) => names(game.platforms) },
  { label: "Developer", value: (game) => names(game.developers) },
  { label: "Publisher", value: (game) => names(game.publishers) },
  { label: "Age rating", value: (game) => game.ageRating },
];

function leads(row: Row, game: GameDetail, other: GameDetail): boolean {
  if (!row.score) return false;
  const mine = row.score(game);
  const theirs = row.score(other);
  return mine !== null && theirs !== null && mine > theirs;
}

function Cell({
  row,
  game,
  other,
  side,
}: {
  row: Row;
  game: GameDetail;
  other: GameDetail;
  side: "a" | "b";
}) {
  const value = row.value(game);
  const lead = leads(row, game, other);
  const score = row.score?.(game) ?? null;

  return (
    <td
      className={cn(
        "px-2 py-3 align-top text-sm sm:px-4 sm:text-base",
        side === "a" ? "text-right" : "text-left",
        lead && "bg-accent font-semibold text-accent-foreground",
      )}
    >
      {value ?? <span className="text-muted-foreground">—</span>}
      {lead ? <span className="sr-only"> (higher)</span> : null}
      {score !== null && row.max ? <Gauge value={score} max={row.max} side={side} /> : null}
    </td>
  );
}

/**
 * Side-by-side comparison of two games. The pair lives in the URL
 * (`/compare?a=…&b=…`) so a comparison can be linked to.
 */
export function CompareView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const slugs: Record<SlotKey, string | null> = { a: null, b: null };
  for (const key of ["a", "b"] as const) {
    const value = searchParams.get(key);
    slugs[key] = value && isSlug(value) ? value : null;
  }

  const [a, b] = useQueries({
    queries: [slugs.a, slugs.b].map((slug) => ({
      ...gameQueries.detail(slug ?? ""),
      enabled: slug !== null,
    })),
  });

  const setSlot = (key: SlotKey, slug: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (slug) params.set(key, slug);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? `/compare?${query}` : "/compare", { scroll: false });
  };

  const slots = [
    { key: "a" as const, slug: slugs.a, other: slugs.b, query: a, label: "Game A" },
    { key: "b" as const, slug: slugs.b, other: slugs.a, query: b, label: "Game B" },
  ];

  const gameA = slugs.a ? a?.data : undefined;
  const gameB = slugs.b ? b?.data : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="relative grid grid-cols-2 gap-3 sm:gap-10">
        {/* The badge between the two corners. */}
        <span
          aria-hidden
          className="absolute top-16 left-1/2 z-10 grid size-10 -translate-x-1/2 place-items-center border border-border-strong bg-foreground sm:top-24 sm:size-14"
        >
          <span className="font-display text-sm font-extrabold text-background sm:text-xl">VS</span>
        </span>

        {slots.map(({ key, slug, other, query, label }) => {
          if (!slug) {
            return (
              <GamePicker
                key={key}
                label={`${label} — pick a game`}
                excludeSlug={other ?? undefined}
                onPick={(picked) => setSlot(key, picked)}
              />
            );
          }

          const game = query?.data;
          return (
            <div key={key} className="panel flex flex-col">
              <div className="flex h-9 items-center justify-between gap-2 border-b border-border-strong bg-surface-elevated pl-3">
                <p className="pixel text-muted-foreground">{label}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  data-sfx="close"
                  onClick={() => setSlot(key, null)}
                  aria-label={`Remove ${game?.title ?? label}`}
                >
                  <X aria-hidden />
                  <span className="hidden sm:inline">Remove</span>
                </Button>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-2 sm:p-3">
                {query?.isPending ? <LoadingBar label="Loading game file…" /> : null}

                {query?.isError ? (
                  <p role="alert" className="text-sm text-danger">
                    {describeError(query.error).body}
                  </p>
                ) : null}

                {game ? (
                  <Link href={gameHref(game.slug)} className="group block -outline-offset-2">
                    <GameArtwork
                      src={game.coverImage}
                      alt=""
                      sizes="(min-width: 64rem) 40vw, 46vw"
                      className="aspect-[16/10] border border-border-strong group-hover:border-accent"
                    />
                    <span className="title mt-3 block text-2xl group-hover:text-link sm:text-4xl">
                      {game.title}
                    </span>
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {gameA && gameB ? (
        <div className="panel">
          <table className="w-full table-fixed border-collapse">
            <caption className="titlebar pixel h-8 px-3 text-left leading-8">
              <span className="sr-only">
                {gameA.title} compared with {gameB.title}
              </span>
              <span aria-hidden>Stat check</span>
            </caption>
            <thead className="sr-only">
              <tr>
                <th scope="col">{gameA.title}</th>
                <th scope="col">Attribute</th>
                <th scope="col">{gameB.title}</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-b-0">
                  <Cell row={row} game={gameA} other={gameB} side="a" />
                  <th
                    scope="row"
                    className="pixel w-24 bg-surface-elevated px-1 py-3 text-center align-middle text-muted-foreground sm:w-40"
                  >
                    <span className="flex flex-col items-center gap-1.5">
                      {row.label}
                      {row.score ? (
                        <span aria-hidden className="flex gap-1.5">
                          {[leads(row, gameA, gameB), leads(row, gameB, gameA)].map((lead, side) => (
                            <span
                              key={side}
                              className={cn("h-1.5 w-3", lead ? "bg-accent" : "bg-border-strong")}
                            />
                          ))}
                        </span>
                      ) : null}
                    </span>
                  </th>
                  <Cell row={row} game={gameB} other={gameA} side="b" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="label text-muted-foreground">
          <span aria-hidden>&gt; </span>Pick two games to see them side by side.
        </p>
      )}
    </div>
  );
}
