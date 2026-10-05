"use client";

import { useState } from "react";

import { GameSelect } from "@/components/game/game-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FEATURED_COUNT, FeaturedHero } from "@/features/home/featured-hero";
import { GenreIndex } from "@/features/home/genre-index";
import { MemoryCardSummary } from "@/features/home/memory-card-summary";
import { Shelf } from "@/features/home/shelf";
import { UpcomingList } from "@/features/home/upcoming-list";

const ENTRIES = [
  { id: "featured", label: "Featured" },
  { id: "popular", label: "Popular" },
  { id: "recent", label: "Recent" },
  { id: "upcoming", label: "Upcoming" },
  { id: "memory", label: "Memory card" },
  { id: "genres", label: "Genre database" },
] as const;

type EntryId = (typeof ENTRIES)[number]["id"];

/**
 * The home screen as a console main menu: a list of entries, one selected,
 * and a single pane showing whatever is selected. Every pane reads data the
 * server already prefetched, so moving the cursor costs no request.
 *
 * Two presentations of the same selection:
 *  - from the `md` breakpoint up, a vertical list with a cursor. It is a
 *    vertical tab list, so Up / Down / Home / End move through it.
 *  - on phones, where a six-row list would push the content off the small
 *    screen, a one-line selector: previous, the current entry, next.
 * Only one of the two is rendered to the accessibility tree at a time (the
 * other is `display: none`).
 */
export function HomeMenu() {
  const [selected, setSelected] = useState<EntryId>("featured");
  const index = ENTRIES.findIndex((entry) => entry.id === selected);
  const current = ENTRIES[index] ?? ENTRIES[0];

  const step = (delta: number) => {
    const next = ENTRIES[(index + delta + ENTRIES.length) % ENTRIES.length];
    if (next) setSelected(next.id);
  };

  return (
    <section aria-labelledby="menu-heading" className="container-page pt-6 sm:pt-10">
      <Tabs
        orientation="vertical"
        value={selected}
        onValueChange={(value) => setSelected(value as EntryId)}
        className="grid! gap-6 md:grid-cols-[12.5rem_minmax(0,1fr)] md:gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10"
      >
        <div>
          <h1 id="menu-heading" className="pixel mb-3 text-muted-foreground md:mb-5 md:pl-3 lg:pl-4">
            Main menu
          </h1>

          {/* Phones: one-line selector. */}
          <div
            role="group"
            aria-label="Main menu"
            className="flex items-stretch border border-border-strong md:hidden"
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous list"
              className="grid w-12 shrink-0 place-items-center text-xs hover:bg-accent hover:text-accent-foreground"
            >
              ◀
            </button>
            <p
              aria-live="polite"
              className="pixel bloom flex h-11 min-w-0 flex-1 items-center justify-between gap-3 bg-accent px-3 text-accent-foreground"
            >
              <span className="truncate">{current.label}</span>
              <span className="label shrink-0 opacity-80">
                {index + 1} / {ENTRIES.length}
              </span>
            </p>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next list"
              className="grid w-12 shrink-0 place-items-center text-xs hover:bg-accent hover:text-accent-foreground"
            >
              ▶
            </button>
          </div>

          {/* Tablet and up: the list, with a cursor. */}
          <TabsList
            aria-label="Main menu"
            className="hidden h-auto! w-full flex-col! items-stretch justify-start gap-0.5 rounded-none bg-transparent p-0 md:flex"
          >
            {ENTRIES.map((entry) => (
              <TabsTrigger
                key={entry.id}
                value={entry.id}
                className="group/entry h-auto min-h-11 w-full! flex-none justify-start gap-2.5 rounded-none border-0! px-3 py-2 text-left font-sans text-sm font-normal tracking-[0.1em] whitespace-normal lg:px-4 lg:text-lg lg:tracking-[0.14em] text-muted-foreground! uppercase -outline-offset-2 after:hidden hover:text-foreground! data-active:bloom data-active:bg-accent! data-active:text-accent-foreground!"
              >
                <span
                  aria-hidden
                  className="text-[0.5rem] opacity-0 group-data-active/entry:opacity-100"
                >
                  ▶
                </span>
                {entry.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="min-w-0">
          <TabsContent value="featured">
            <FeaturedHero />
          </TabsContent>
          <TabsContent value="popular">
            <Shelf
              id="popular-heading"
              title="Popular titles"
              note="Most added this year"
              href="/games?sort=popularity"
              shelf="popular"
              // The first few are the featured titles.
              select={(games) => games.slice(FEATURED_COUNT)}
              skeletonCount={8}
            >
              {(games) => <GameSelect games={games} headingLevel="h3" />}
            </Shelf>
          </TabsContent>
          <TabsContent value="recent">
            <Shelf
              id="recent-heading"
              title="Recently released"
              note="Last 60 days"
              href="/games?sort=released"
              shelf="recent"
              select={(games) => games.slice(0, 8)}
              skeletonCount={8}
            >
              {(games) => <GameSelect games={games} headingLevel="h3" />}
            </Shelf>
          </TabsContent>
          <TabsContent value="upcoming">
            <Shelf
              id="upcoming-heading"
              title="Upcoming"
              note="Release schedule"
              shelf="upcoming"
              select={(games) => games.slice(0, 10)}
              skeletonCount={4}
            >
              {(games) => <UpcomingList games={games} />}
            </Shelf>
          </TabsContent>
          <TabsContent value="memory">
            <MemoryCardSummary />
          </TabsContent>
          <TabsContent value="genres">
            <GenreIndex />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}
