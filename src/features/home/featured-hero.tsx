"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { GameArtwork } from "@/components/game/game-artwork";
import { PlatformCodes } from "@/components/game/platform-codes";
import { Metascore, PlayerRating } from "@/components/game/rating";
import { ErrorPanel } from "@/components/state/error-panel";
import { LoadingBar } from "@/components/state/loading-bar";
import { StatusPanel } from "@/components/state/status-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gameQueries } from "@/features/games/api/queries";
import { FavoriteButton } from "@/features/library/favorite-button";
import { SurpriseButton } from "@/features/surprise/surprise-button";
import { archiveNo, formatLongDate, gameHref } from "@/lib/format";
import type { GameSummary } from "@/types/game";

export const FEATURED_COUNT = 4;

const LAYOUT = "grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]";

/** The picture window: a framed, scan-lined image with a caption strip. */
function Picture({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="panel flex flex-col">
      <p className="titlebar pixel flex h-8 shrink-0 items-center gap-2 px-3">
        <span className="truncate">{caption}</span>
      </p>
      <div className="flex-1 p-1.5">{children}</div>
    </div>
  );
}

function Slot({
  game,
  position,
  preload,
}: {
  game: GameSummary;
  /** e.g. "1 / 4" — which of the featured titles this is. */
  position: string;
  preload: boolean;
}) {
  return (
    <div className={`${LAYOUT} animate-rise`}>
      <Picture caption={`Title ${position} · ${archiveNo(game.id)}`}>
        <Link href={gameHref(game.slug)} tabIndex={-1} aria-hidden className="block">
          <GameArtwork
            src={game.coverImage}
            alt=""
            sizes="(min-width: 96rem) 54rem, (min-width: 64rem) 58vw, 100vw"
            preload={preload}
            className="aspect-video"
          />
        </Link>
      </Picture>

      <div className="panel flex flex-col xl:h-full">
        <p className="pixel flex h-8 items-center justify-between gap-2 border-b border-border-strong bg-surface-elevated px-3 text-muted-foreground">
          <span>Featured title</span>
          <span aria-hidden>{archiveNo(game.id)}</span>
        </p>

        <div className="flex flex-1 flex-col items-start gap-4 p-4 sm:p-6">
          {game.genres.length > 0 ? (
            <p className="label text-link">
              {game.genres
                .slice(0, 3)
                .map((genre) => genre.name)
                .join(" / ")}
            </p>
          ) : null}

          <h3 className="title text-4xl sm:text-5xl 2xl:text-6xl">{game.title}</h3>

          <dl className="label mt-auto grid w-full grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 border-t border-border pt-4">
            {game.rating !== null ? (
              <>
                <dt className="text-muted-foreground">Rating</dt>
                <dd>
                  <PlayerRating rating={game.rating} />
                </dd>
              </>
            ) : null}
            {game.metascore !== null ? (
              <>
                <dt className="text-muted-foreground">Metascore</dt>
                <dd>
                  <Metascore score={game.metascore} />
                </dd>
              </>
            ) : null}
            {game.releaseDate ? (
              <>
                <dt className="text-muted-foreground">Release</dt>
                <dd>{formatLongDate(game.releaseDate)}</dd>
              </>
            ) : null}
            {game.platforms.length > 0 ? (
              <>
                <dt className="text-muted-foreground">System</dt>
                <dd>
                  <PlatformCodes platforms={game.platforms} className="text-foreground" />
                </dd>
              </>
            ) : null}
          </dl>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href={gameHref(game.slug)}>
                Open entry <span aria-hidden>▶</span>
              </Link>
            </Button>
            <FavoriteButton game={game} showLabel className="h-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSkeleton() {
  return (
    <div className={LAYOUT}>
      <div className="panel p-1.5">
        <div className="titlebar -mx-1.5 -mt-1.5 mb-1.5 h-8" />
        <Skeleton className="aspect-video" />
      </div>
      <div className="panel flex flex-col gap-4 p-4 sm:p-6">
        <LoadingBar label="Loading game database…" />
        <Skeleton className="h-14 w-4/5" />
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="mt-auto h-12 w-40" />
      </div>
    </div>
  );
}

/**
 * The FEATURED pane of the main menu: the four most popular games as numbered
 * title slots. Choosing one loads it into the picture window.
 */
export function FeaturedHero() {
  const { data, error, isPending, isError, isRefetching, refetch } = useQuery(
    gameQueries.popular(),
  );
  const [selected, setSelected] = useState<string | null>(null);

  const featured = data?.slice(0, FEATURED_COUNT) ?? [];
  const active = featured.find((game) => game.slug === selected) ?? featured[0];

  return (
    <section aria-labelledby="hero-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h2 id="hero-heading" className="sr-only">
          Featured titles
        </h2>
        <SurpriseButton className="sm:hidden" />
      </div>

      {isPending ? <HeroSkeleton /> : null}

      {isError ? (
        <ErrorPanel error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
      ) : null}

      {data && !active ? (
        <StatusPanel
          status="Nothing featured"
          title="No featured games right now"
          action={
            <Button asChild>
              <Link href="/games">Browse all games</Link>
            </Button>
          }
        >
          The popular list came back empty. The full archive is still open.
        </StatusPanel>
      ) : null}

      {active ? (
        <Tabs value={active.slug} onValueChange={setSelected} className="gap-4">
          {featured.map((game, index) => (
            <TabsContent key={game.id} value={game.slug}>
              <Slot
                game={game}
                position={`${index + 1} / ${featured.length}`}
                preload={index === 0}
              />
            </TabsContent>
          ))}

          {/* Title select: four numbered slots; the loaded one is lit. */}
          <TabsList
            aria-label="Featured games"
            className="grid h-auto! w-full grid-cols-2 gap-0 rounded-none border border-border-strong bg-surface p-0 xl:grid-cols-4"
          >
            {featured.map((game, index) => (
              <TabsTrigger
                key={game.id}
                value={game.slug}
                className="group/slot h-auto justify-start gap-3 rounded-none border-0! p-2.5 text-left whitespace-normal text-muted-foreground! -outline-offset-2 after:hidden hover:bg-surface-elevated! data-active:bg-accent! data-active:text-accent-foreground!"
              >
                <span className="grid size-9 shrink-0 place-items-center border border-current font-mono text-lg leading-none">
                  {index + 1}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="pixel flex items-center gap-1.5 text-[0.6875rem]">
                    <span aria-hidden className="text-[0.5rem] opacity-0 group-data-active/slot:opacity-100">
                      ▶
                    </span>
                    Title {index + 1}
                  </span>
                  <span className="title line-clamp-1 text-lg">{game.title}</span>
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      ) : null}
    </section>
  );
}
