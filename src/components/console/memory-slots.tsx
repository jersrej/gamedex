"use client";

import { useLibrary } from "@/features/library/hooks";

/**
 * A memory-card slot on the front panel. Slot 1 shows a card seated in it
 * once the library holds anything; slot 2 is always empty. Decorative — the
 * Memory section is where the card is actually read.
 */
export function MemorySlots({ slot }: { slot: number }) {
  const inserted = useLibrary().length > 0 && slot === 1;

  return (
    <span className="recess relative block h-2.5 w-[4.75rem] rounded-[1px]">
      {inserted ? (
        <span className="absolute inset-x-1.5 top-0.5 bottom-0 rounded-t-[1px] bg-[#5d5b56] shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]" />
      ) : null}
    </span>
  );
}
