"use client";

import Link from "next/link";

import { GameArtwork } from "@/components/game/game-artwork";
import { SectionHeading } from "@/components/layout/section-heading";
import { LoadingBar } from "@/components/state/loading-bar";
import { useLibrary, useLibraryReady } from "@/features/library/hooks";
import { STATUS_LABELS } from "@/features/library/store";
import { gameHref } from "@/lib/format";

const PREVIEW = 8;

/**
 * The visitor's own library on the home screen, as save blocks. Reads the
 * same local store as the Memory Card page; makes no requests.
 */
export function MemoryCardSummary() {
  const ready = useLibraryReady();
  const entries = useLibrary();

  // Until the browser's saved data can be read there is nothing true to show.
  if (!ready) return <LoadingBar label="Reading memory card…" className="max-w-sm" />;

  return (
    <section aria-labelledby="memory-heading">
      <SectionHeading
        id="memory-heading"
        title="Memory card"
        note={`${entries.length} ${entries.length === 1 ? "block" : "blocks"} used`}
        href="/library"
        hrefLabel="Open card"
      />

      {entries.length === 0 ? (
        <p className="panel label p-4 text-muted-foreground">
          No save data. Favorite a game or give it a play status and it is written here.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 min-[30rem]:grid-cols-2 xl:grid-cols-3">
          {entries.slice(0, PREVIEW).map((entry) => (
            <li key={entry.game.id}>
              <Link
                href={gameHref(entry.game.slug)}
                className="panel group flex items-center gap-3 p-2 -outline-offset-2 hover:border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <GameArtwork
                  src={entry.game.coverImage}
                  alt=""
                  sizes="64px"
                  className="size-12 shrink-0 border border-border-strong"
                />
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-sm leading-tight font-semibold">
                    {entry.game.title}
                  </span>
                  <span className="pixel truncate text-muted-foreground group-hover:text-accent-foreground">
                    {entry.status ? STATUS_LABELS[entry.status] : "Favorite"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
