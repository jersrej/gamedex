"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { GameArtwork } from "@/components/game/game-artwork";
import { StatusPanel } from "@/components/state/status-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FavoriteButton } from "@/features/library/favorite-button";
import { useLibrary, useLibraryReady } from "@/features/library/hooks";
import { StatusSelect } from "@/features/library/status-select";
import {
  LIBRARY_STATUSES,
  STATUS_LABELS,
  removeFromLibrary,
  type LibraryEntry,
  type LibraryStatus,
} from "@/features/library/store";
import { gameHref, releaseYear } from "@/lib/format";

type Shelf = "all" | "favorites" | LibraryStatus;

const SHELVES: { value: Shelf; label: string }[] = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  ...LIBRARY_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

function onShelf(entry: LibraryEntry, shelf: Shelf): boolean {
  if (shelf === "all") return true;
  if (shelf === "favorites") return entry.favorite;
  return entry.status === shelf;
}

const BLOCKS_PER_CARD = 15;

function SaveBlock({ entry, block }: { entry: LibraryEntry; block: number }) {
  const { game } = entry;

  return (
    <li className="flex flex-col gap-3 border-b border-border p-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <Link
        href={gameHref(game.slug)}
        className="group flex min-w-0 flex-1 items-center gap-3 -outline-offset-2 sm:gap-4"
      >
        <span aria-hidden className="label w-7 shrink-0 text-muted-foreground tabular-nums">
          {String(block).padStart(2, "0")}
        </span>
        <GameArtwork
          src={game.coverImage}
          alt=""
          sizes="96px"
          className="size-14 shrink-0 border border-border-strong group-hover:border-accent sm:size-16"
        />
        <span className="flex min-w-0 flex-col gap-1">
          <span className="title text-2xl group-hover:text-link">{game.title}</span>
          <span className="label text-muted-foreground tabular-nums">
            {releaseYear(game.releaseDate) ?? "TBA"}
            <span aria-hidden> · </span>
            <span className={entry.status ? "text-foreground" : undefined}>
              Status: {entry.status ? STATUS_LABELS[entry.status] : "none"}
            </span>
          </span>
        </span>
      </Link>

      <div className="flex items-center gap-2 pl-10 sm:pl-0">
        <StatusSelect game={game} className="w-full min-w-40 sm:w-44" />
        <FavoriteButton game={game} className="shrink-0" />
        <Button
          variant="destructive"
          size="icon"
          className="shrink-0"
          data-sfx="close"
          onClick={() => removeFromLibrary(game)}
          aria-label={`Remove ${game.title} from library`}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
    </li>
  );
}

/**
 * The memory card utility, in system mode: which card, blocks used and free,
 * and one plain slot per block. A picture of the library only — the real
 * store has no size limit, so a full card rolls over to "card 02" rather
 * than refusing anything.
 */
function MemoryCard({ used }: { used: number }) {
  const cards = Math.max(1, Math.ceil(used / BLOCKS_PER_CARD));
  const onThisCard = used === 0 ? 0 : used - (cards - 1) * BLOCKS_PER_CARD;
  const free = BLOCKS_PER_CARD - onThisCard;
  const stats = [
    { term: "Memory card", value: `Card ${String(cards).padStart(2, "0")}` },
    { term: "Used blocks", value: String(used) },
    { term: "Free blocks", value: String(free) },
  ];

  return (
    <div className="system flex flex-wrap items-center gap-x-10 gap-y-5 border-t-4 border-accent p-4 sm:p-6">
      <dl className="grid grid-cols-[auto_auto] items-baseline gap-x-6 gap-y-1.5">
        {stats.map((stat) => (
          <div key={stat.term} className="contents">
            <dt className="pixel text-system-ink/75">{stat.term}</dt>
            <dd className="font-mono text-lg leading-none text-system-ink tabular-nums uppercase">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div aria-hidden className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: BLOCKS_PER_CARD }, (_, index) => (
          <span
            key={index}
            className={
              index < onThisCard
                ? "h-5 w-8 bg-accent"
                : "h-5 w-8 border border-system-ink/40"
            }
          />
        ))}
      </div>
    </div>
  );
}

export function LibraryView() {
  const ready = useLibraryReady();
  const entries = useLibrary();
  const [shelf, setShelf] = useState<Shelf>("all");

  if (!ready) {
    return (
      <div role="status" className="flex flex-col gap-3">
        <span className="sr-only">Loading your library…</span>
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} aria-hidden className="h-24 w-full border-2 border-border-strong" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <MemoryCard used={0} />
        <StatusPanel
          status="0 blocks used"
          title="Memory card is empty"
          action={
            <Button asChild>
              <Link href="/games">Find a game</Link>
            </Button>
          }
        >
          Favorite a game or give it a status — want to play, playing, completed,
          dropped — and it is saved here. Everything is kept in this browser.
        </StatusPanel>
      </div>
    );
  }

  const visible = entries.filter((entry) => onShelf(entry, shelf));
  const shelfLabel = SHELVES.find((item) => item.value === shelf)?.label ?? "";

  return (
    <Tabs value={shelf} onValueChange={(value) => setShelf(value as Shelf)} className="gap-4">
      <MemoryCard used={entries.length} />

      {/* Scrolls sideways on narrow screens instead of wrapping into a wall. */}
      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <TabsList
          aria-label="Library shelves"
          className="h-auto! w-max gap-1 rounded-none bg-transparent p-0"
        >
          {SHELVES.map((item) => {
            const count = entries.filter((entry) => onShelf(entry, item.value)).length;
            return (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="pixel h-10 flex-none gap-2 rounded-none border border-border-strong! px-3 text-muted-foreground! after:hidden hover:text-foreground! data-active:border-accent! data-active:bg-accent! data-active:text-accent-foreground!"
              >
                {item.label}
                <span className="font-mono text-sm tabular-nums opacity-80">{count}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {/* One panel whose contents follow the selected shelf. */}
      <div role="tabpanel" aria-label={shelfLabel}>
        {visible.length === 0 ? (
          <StatusPanel status="Empty shelf" title={`Nothing under ${shelfLabel}`}>
            Change a game’s status or favorite it to file it here.
          </StatusPanel>
        ) : (
          <ul className="panel" aria-label="Save data">
            {visible.map((entry, index) => (
              <SaveBlock key={entry.game.id} entry={entry} block={index + 1} />
            ))}
          </ul>
        )}
      </div>
    </Tabs>
  );
}
