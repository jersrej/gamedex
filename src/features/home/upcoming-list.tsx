import Link from "next/link";

import { GameArtwork } from "@/components/game/game-artwork";
import { PlatformCodes } from "@/components/game/platform-codes";
import { formatShortDate, gameHref } from "@/lib/format";
import type { GameSummary } from "@/types/game";

/**
 * Upcoming games as a release schedule: for something you can't play yet the
 * date is the headline, so each row leads with it on a tear-off calendar tab.
 */
export function UpcomingList({ games }: { games: GameSummary[] }) {
  return (
    <ol className="panel grid grid-cols-1 xl:grid-cols-2">
      {games.map((game) => (
        <li
          key={game.id}
          className="min-w-0 border-b border-border last:border-b-0 xl:border-r xl:even:border-r-0 xl:nth-last-[2]:odd:border-b-0"
        >
          <Link
            href={gameHref(game.slug)}
            className="group flex items-center gap-3 p-2.5 -outline-offset-2 hover:bg-accent hover:text-accent-foreground sm:gap-4"
          >
            <time
              dateTime={game.releaseDate ?? undefined}
              className="flex h-12 w-14 shrink-0 flex-col items-center justify-center border border-border-strong bg-background font-display text-xs leading-tight font-bold tracking-wider text-foreground uppercase"
            >
              {game.releaseDate ? (
                <>
                  <span>{formatShortDate(game.releaseDate)}</span>
                  <span className="text-accent-secondary">{game.releaseDate.slice(0, 4)}</span>
                </>
              ) : (
                <span>TBA</span>
              )}
            </time>
            <GameArtwork
              src={game.coverImage}
              alt=""
              sizes="112px"
              className="hidden aspect-[16/10] w-20 shrink-0 border border-border-strong min-[24rem]:block sm:w-24"
            />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="title truncate text-xl sm:text-2xl">{game.title}</span>
              <PlatformCodes
                platforms={game.platforms}
                className="truncate group-hover:text-accent-foreground"
              />
            </span>
            <span aria-hidden className="reveal ml-auto pr-1 font-mono text-xs">
              ▶
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
