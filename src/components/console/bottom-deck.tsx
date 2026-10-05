import { MemorySlots } from "@/components/console/memory-slots";
import { DPad, HandheldNav } from "@/components/layout/nav";
import { SearchButton } from "@/features/search/search-button";
import { SurpriseButton } from "@/features/surprise/surprise-button";
import { ResetControl, ResetLink } from "@/features/system/reboot-button";
import { SoundToggle } from "@/features/system/sound-toggle";

/**
 * The console's front panel, below the display. Deliberately lopsided, the
 * way home consoles of the time were: operating keys and the directional pad
 * on the left, the CD-ROM tray line across the middle, memory-card slots and
 * controller sockets on the right, model plate in the corner. On the handheld
 * it carries the section keys instead. Its upper edge is the bottom of the
 * display bezel.
 */
export function BottomDeck() {
  return (
    <div className="deck deck-bottom">
      <div aria-hidden className="bezel-edge" />

      <div className="flex h-full items-center px-[max(0.5rem,var(--shell))] pt-[var(--bezel)] pb-[0.4rem]">
        <div className="flex w-full flex-col md:hidden">
          <HandheldNav />
          {/* Printed along the lower edge of the handheld. */}
          <p className="printed flex h-10 items-center justify-between gap-3 px-1 text-[0.5625rem]">
            <span>
              Game data:{" "}
              <a
                href="https://rawg.io"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 min-w-10 items-center underline underline-offset-2"
              >
                RAWG
              </a>
            </span>
            <ResetLink />
          </p>
        </div>

        <div className="hidden w-full items-center gap-5 md:flex lg:gap-8">
          {/* Left: operating keys. */}
          <div role="group" aria-label="Console controls" className="flex items-start gap-2 lg:gap-3">
            <ResetControl />
            <SurpriseButton variant="deck" />
            <SearchButton />
            <SoundToggle />
          </div>

          <DPad className="hidden shrink-0 lg:grid" />

          {/* Middle: the drive, shown only as the thin line of its tray door. */}
          <div aria-hidden className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="seam" />
            <span className="hidden items-center gap-3 xl:flex">
              <span className="recess h-1.5 flex-1 rounded-[1px]" />
              <span className="printed shrink-0 text-[0.5625rem]">CD-ROM</span>
            </span>
          </div>

          {/* Right: memory-card slots over controller sockets. */}
          <div aria-hidden className="hidden shrink-0 gap-3 lg:flex">
            {[1, 2].map((socket) => (
              <div key={socket} className="flex flex-col items-center gap-1.5">
                <MemorySlots slot={socket} />
                <span className="recess port" />
                <span className="printed text-[0.5rem]">{socket}</span>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <p className="flex flex-col items-end gap-1.5">
              <span aria-hidden className="printed">
                Model GDX-01
              </span>
              <span className="printed text-[0.5625rem]">
                Game data:{" "}
                <a
                  href="https://rawg.io"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2 hover:text-plastic-ink"
                >
                  RAWG
                </a>
              </span>
            </p>
            <span aria-hidden className="screw" />
          </div>
        </div>
      </div>
    </div>
  );
}
