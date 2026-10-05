import Link from "next/link";

import { Lcd } from "@/components/console/lcd";
import { Leds } from "@/components/console/leds";
import { DeckNav } from "@/components/layout/nav";
import { SearchButton } from "@/features/search/search-button";
import { Signature } from "@/features/system/signature";
import { Wordmark, WordmarkDescriptor } from "@/features/system/wordmark";

/** The GameDex badge printed on the casing: signature bars, name, descriptor. */
function Badge() {
  return (
    <Link
      href="/"
      aria-label="GameDex home"
      className="flex min-h-10 shrink-0 flex-col items-center justify-center gap-1 px-1 text-[#2443c6] md:gap-1.5 md:px-2"
    >
      <Signature className="h-2.5 w-5 md:h-3 md:w-6" />
      <Wordmark className="h-3 min-[22.5rem]:h-4 md:h-[1.125rem] lg:h-5" />
      <WordmarkDescriptor className="hidden h-[0.3125rem] text-[#504e4a] md:block lg:h-1.5" />
    </Link>
  );
}

/**
 * Top of the casing: section keys on the left, the GameDex badge in the
 * middle, the LCD and indicator lamps on the right. Its lower edge is the top
 * of the display bezel.
 *
 * A three-column grid with equal side columns keeps the badge on the centre
 * line at every width; the section keys tighten up on tablets to make room.
 */
export function TopDeck() {
  return (
    <header className="deck deck-top">
      <div className="grid h-[calc(100%-var(--bezel))] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5 px-[max(0.5rem,var(--shell))] md:gap-3 xl:gap-6">
        <div className="flex items-center justify-self-start">
          {/* Handheld: lamps sit left of the badge. */}
          <Leds className="pl-1 md:hidden" />
          <DeckNav className="hidden md:block" />
        </div>

        <Badge />

        <div className="flex items-center gap-3 justify-self-end lg:gap-5">
          <Lcd className="hidden xl:flex" />
          <Leds className="hidden md:flex" />
          {/* Handheld: SEARCH lives up here; on larger units it is on the lower deck. */}
          <SearchButton className="md:hidden" />
        </div>
      </div>
      <div aria-hidden className="bezel-edge" />
    </header>
  );
}
