"use client";

import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Swords } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

import { GameArtwork } from "@/components/game/game-artwork";
import { SectionHeading } from "@/components/layout/section-heading";
import { Metascore, PlayerRating } from "@/components/game/rating";
import { ErrorPanel } from "@/components/state/error-panel";
import { LoadingBar } from "@/components/state/loading-bar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { gameQueries } from "@/features/games/api/queries";
import { ScreenshotGallery } from "@/features/games/components/screenshot-gallery";
import { SeriesGames } from "@/features/games/components/series-games";
import { FavoriteButton } from "@/features/library/favorite-button";
import { StatusSelect } from "@/features/library/status-select";
import { catalogId, formatCount, releaseLabel, releaseYear } from "@/lib/format";
import type { GameDetail } from "@/types/game";

const COLLAPSED_PARAGRAPHS = 2;

function About({ paragraphs }: { paragraphs: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const collapsible = paragraphs.length > COLLAPSED_PARAGRAPHS;
  const visible = expanded ? paragraphs : paragraphs.slice(0, COLLAPSED_PARAGRAPHS);

  return (
    <section aria-labelledby="about-heading">
      <SectionHeading id="about-heading" title="About" />
      {paragraphs.length === 0 ? (
        <p className="text-muted-foreground">No description has been written for this game yet.</p>
      ) : (
        <div id="about-text" className="flex max-w-prose flex-col gap-4 leading-relaxed text-foreground/90">
          {visible.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {collapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls="about-text"
          onClick={() => setExpanded((value) => !value)}
          className="pixel mt-4 px-2 py-2 text-link hover:bg-accent hover:text-accent-foreground"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
    </section>
  );
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 border-b border-border px-3 py-3 last:border-b-0 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      <dt className="label pt-0.5 text-muted-foreground">{term}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function LinkList({
  items,
  basePath,
}: {
  items: { slug: string; name: string }[];
  basePath: string;
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={`${basePath}/${item.slug}`}
            className="label inline-flex h-7 items-center border border-border-strong px-2 hover:border-accent hover:bg-accent hover:text-accent-foreground"
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The spec sheet: only fields a player would look for, and only when present. */
function GameFile({ game }: { game: GameDetail }) {
  const names = (items: { name: string }[]) => items.map((item) => item.name).join(", ");

  return (
    <aside aria-labelledby="file-heading" className="panel lg:sticky lg:top-[calc(var(--deck-top)+1rem)] lg:self-start">
      <h2 id="file-heading" className="titlebar pixel flex h-8 items-center gap-2 px-3">
        Game file
        <span aria-hidden className="ml-auto">
          {catalogId(game.id)}
        </span>
      </h2>
      <dl>
        <Fact term="Release">
          {game.releaseDate ? (
            <time dateTime={game.releaseDate}>{releaseLabel(game)}</time>
          ) : (
            releaseLabel(game)
          )}
        </Fact>
        {game.genres.length > 0 ? (
          <Fact term="Genres">
            <LinkList items={game.genres} basePath="/genres" />
          </Fact>
        ) : null}
        {game.platforms.length > 0 ? (
          <Fact term="Platforms">
            <LinkList items={game.platforms} basePath="/platforms" />
          </Fact>
        ) : null}
        {game.developers.length > 0 ? (
          <Fact term="Developer">{names(game.developers)}</Fact>
        ) : null}
        {game.publishers.length > 0 ? (
          <Fact term="Publisher">{names(game.publishers)}</Fact>
        ) : null}
        {game.playtime ? <Fact term="Avg. playtime">{game.playtime} hours</Fact> : null}
        {game.ageRating ? <Fact term="Age rating">{game.ageRating}</Fact> : null}
        {game.tags.length > 0 ? (
          <Fact term="Tags">
            <span className="text-muted-foreground">{game.tags.join(" · ")}</span>
          </Fact>
        ) : null}
        {game.stores.length > 0 ? (
          <Fact term="Stores">
            <ul className="flex flex-col gap-1.5">
              {game.stores.map((store) => (
                <li key={store.id}>
                  <a
                    href={store.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-link underline underline-offset-4 hover:bg-accent hover:text-accent-foreground"
                  >
                    {store.name}
                    <ExternalLink aria-hidden className="size-3" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Fact>
        ) : null}
      </dl>
    </aside>
  );
}

function Hero({ game }: { game: GameDetail }) {
  const year = releaseYear(game.releaseDate) ?? (game.tba ? "TBA" : null);

  return (
    <header className="relative isolate border-b border-border-strong">
      <GameArtwork
        src={game.coverImage}
        alt=""
        sizes="100vw"
        preload
        className="absolute inset-0 -z-10 h-full"
        imageClassName="object-top"
      />
      {/* Scrim keeps the title readable over any artwork. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-linear-to-t from-background via-background/80 to-background/25"
      />

      <div className="container-page flex min-h-[26rem] flex-col justify-end gap-4 pt-24 pb-6 sm:min-h-[32rem] sm:pb-8 lg:min-h-[38rem]">
        <p className="flex flex-wrap items-center gap-2">
          <span className="titlebar pixel flex h-7 items-center gap-2 px-2.5">
            GameDex archive · entry
          </span>
          <span className="label bg-background px-2 py-1">{catalogId(game.id)}</span>
          {year ? (
            <span className="label bg-background px-2 py-1 tabular-nums">{year}</span>
          ) : null}
        </p>

        <h1 className="title aberration max-w-5xl text-5xl sm:text-7xl lg:text-8xl">
          {game.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <PlayerRating rating={game.rating} className="text-lg" />
          {game.rating !== null ? (
            <span className="label text-muted-foreground">
              {formatCount(game.ratingsCount)} ratings
            </span>
          ) : (
            <span className="label text-muted-foreground">Not rated yet</span>
          )}
          <Metascore score={game.metascore} className="h-6 min-w-9 text-base" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <FavoriteButton game={game} showLabel />
          <StatusSelect game={game} className="w-44" />
          <Button asChild variant="outline">
            <Link href={`/compare?a=${game.slug}`}>
              <Swords aria-hidden />
              Compare
            </Link>
          </Button>
          {game.website ? (
            <Button asChild variant="outline">
              <a href={game.website} target="_blank" rel="noreferrer">
                Official site
                <ExternalLink aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function ProfileSkeleton() {
  return (
    <div className="container-page pt-28 pb-10">
      <LoadingBar label="Loading game file…" className="max-w-sm" />
      <Skeleton className="mt-6 h-16 w-3/4 sm:h-24" />
      <Skeleton className="mt-4 h-6 w-1/3" />
      <Skeleton className="mt-10 h-40 w-full max-w-prose" />
    </div>
  );
}

/**
 * A game's profile page. The record itself usually arrives hydrated from the
 * server; screenshots and series load on their own as they scroll into view.
 */
export function GameProfile({ slug }: { slug: string }) {
  const { data: game, error, isPending, isError, isRefetching, refetch } = useQuery(
    gameQueries.detail(slug),
  );

  if (isPending) return <ProfileSkeleton />;

  if (isError) {
    return (
      <div className="container-page py-16">
        <ErrorPanel error={error} onRetry={() => refetch()} isRetrying={isRefetching} />
      </div>
    );
  }

  return (
    <article>
      <Hero game={game} />
      <div className="container-page mt-8 grid gap-x-10 gap-y-12 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-w-0 flex-col gap-12">
          <About paragraphs={game.description} />
          <ScreenshotGallery slug={slug} title={game.title} />
          <SeriesGames slug={slug} />
        </div>
        <GameFile game={game} />
      </div>
    </article>
  );
}
