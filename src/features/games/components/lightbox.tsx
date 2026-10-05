"use client";

import Image from "next/image";
import { useRef, type KeyboardEvent, type TouchEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Screenshot } from "@/types/game";

const SWIPE_THRESHOLD = 48;

/**
 * Image viewer: a black screen, the picture, and a line of system text. Arrow keys, on-screen keys and horizontal swipes all
 * move between shots; Escape closes (handled by the dialog).
 */
export function Lightbox({
  title,
  screenshots,
  index,
  onIndexChange,
  onClose,
}: {
  title: string;
  screenshots: Screenshot[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const touchStartX = useRef<number | null>(null);
  const shot = screenshots[index];
  if (!shot) return null;

  const count = screenshots.length;
  const step = (delta: number) => onIndexChange((index + delta + count) % count);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "ArrowRight") step(1);
    if (event.key === "ArrowLeft") step(-1);
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current;
    const end = event.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start === null || end === undefined) return;
    if (Math.abs(end - start) > SWIPE_THRESHOLD) step(end < start ? 1 : -1);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onKeyDown={onKeyDown}
        showCloseButton={false}
        className="top-(--deck-top)! right-(--screen-x)! bottom-(--deck-bottom)! left-(--screen-x)! flex w-auto! max-w-none! translate-x-0! translate-y-0! flex-col gap-0 overflow-hidden rounded-(--screen-radius) border-0 bg-black p-0 shadow-none"
      >
        <div className="flex h-11 shrink-0 items-center gap-3 px-4">
          <DialogTitle className="pixel min-w-0 truncate text-muted-foreground">
            Viewing image
            <span className="hidden sm:inline"> · {title}</span>
          </DialogTitle>
          <DialogDescription
            className="label ml-auto shrink-0 text-foreground tabular-nums"
            aria-live="polite"
          >
            Screenshot {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </DialogDescription>
        </div>

        <div
          className="relative min-h-0 flex-1 touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Image
            key={shot.id}
            src={shot.image}
            alt={`${title} screenshot ${index + 1} of ${count}`}
            fill
            sizes="100vw"
            className="animate-rise object-contain"
          />
        </div>

        <div className="flex h-14 shrink-0 items-center justify-center gap-1 px-3">
          <Button variant="ghost" onClick={() => step(-1)} aria-label="Previous screenshot" data-sfx="none">
            <span aria-hidden>◀</span>
            <span className="hidden sm:inline">Previous</span>
          </Button>
          <Button variant="ghost" onClick={() => step(1)} aria-label="Next screenshot" data-sfx="none">
            <span className="hidden sm:inline">Next</span>
            <span aria-hidden>▶</span>
          </Button>
          <Button variant="ghost" onClick={onClose} data-sfx="close" className="ml-4">
            Exit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
