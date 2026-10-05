"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { SectionHeading } from "@/components/layout/section-heading";
import { Skeleton } from "@/components/ui/skeleton";
import { catalogQueries } from "@/features/catalog/queries";
import { formatCount } from "@/lib/format";

/** Every genre as a directory listing — a way in for people with no title in mind. */
export function GenreIndex() {
  const { data, isPending } = useQuery(catalogQueries.genres());

  // Purely a navigation aid: if genres can't load, the section stays out of the way.
  if (!isPending && (!data || data.length === 0)) return null;

  return (
    <section aria-labelledby="genres-heading">
      <SectionHeading
        id="genres-heading"
        title="Genre database"
        note={data ? `${data.length} entries` : undefined}
      />
      {isPending ? (
        <div role="status" className="panel grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
          <span className="sr-only">Loading genres…</span>
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} aria-hidden className="h-8" />
          ))}
        </div>
      ) : (
        <ul className="system grid gap-x-8 border-t-4 border-accent p-3 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
          {data?.map((genre) => (
            <li key={genre.id}>
              <Link
                href={`/genres/${genre.slug}`}
                className="group flex h-10 items-baseline gap-2 px-2 text-system-ink -outline-offset-2 hover:bg-accent hover:text-accent-foreground"
              >
                <span aria-hidden className="reveal font-mono text-xs">
                  ▶
                </span>
                <span className="title text-2xl">{genre.name}</span>
                <span
                  aria-hidden
                  className="h-0 min-w-4 flex-1 border-b border-dotted border-system-ink/40 group-hover:border-accent-foreground/50"
                />
                {genre.gamesCount ? (
                  <span className="label text-system-ink/80 tabular-nums group-hover:text-accent-foreground">
                    {formatCount(genre.gamesCount)}
                    <span className="sr-only"> games</span>
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
