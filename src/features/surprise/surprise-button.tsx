"use client";

import { useMutation } from "@tanstack/react-query";
import { Disc3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { DeckControl } from "@/components/console/deck-control";
import { EjectGlyph } from "@/components/console/glyphs";
import { describeError } from "@/components/state/error-panel";
import { Button } from "@/components/ui/button";
import { fetchRandomGame } from "@/features/games/api/queries";
import { sfx } from "@/lib/audio/sound";
import { gameHref } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Shared key so the casing's LCD can report on the drive while it reads. */
export const RANDOM_MUTATION_KEY = ["random-game"] as const;

/**
 * "Random disc": asks the archive for a random well-reviewed game and opens
 * it. The stages reported are the real ones — the request ("Reading disc"),
 * then the navigation ("Data found") — with no delay added for show.
 *
 * `deck` renders the console's round OPEN (eject) button; the default is an on-screen
 * button that spells the stages out.
 */
export function SurpriseButton({
  variant = "screen",
  size = "default",
  className,
}: {
  variant?: "screen" | "deck";
  size?: "default" | "lg";
  className?: string;
}) {
  const router = useRouter();
  const [isOpening, startOpening] = useTransition();

  const roll = useMutation({
    mutationKey: RANDOM_MUTATION_KEY,
    mutationFn: fetchRandomGame,
    retry: false,
    onSuccess: (game) => {
      sfx("confirm");
      startOpening(() => router.push(gameHref(game.slug)));
    },
    onError: () => sfx("error"),
  });

  const busy = roll.isPending || isOpening;
  const stage = roll.isPending
    ? "Reading disc…"
    : isOpening && roll.data
      ? `Data found: ${roll.data.title}`
      : roll.isError
        ? "Disc read error — retry"
        : null;
  const press = busy ? undefined : () => roll.mutate();

  if (variant === "deck") {
    return (
      <span className={cn("inline-flex", className)}>
        <DeckControl
          label="Open"
          hint="Random disc"
          led={busy}
          down={busy}
          round
          aria-label="Surprise me"
          // Stays focusable while busy; extra presses are simply ignored.
          aria-disabled={busy}
          data-sfx="disc"
          onClick={press}
        >
          <EjectGlyph />
        </DeckControl>
        <span className="sr-only" role="status">
          {stage}
        </span>
        {roll.isError ? (
          <span role="alert" className="sr-only">
            {describeError(roll.error).body}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <Button
        size={size}
        data-sfx="disc"
        aria-disabled={busy}
        onClick={press}
        className="max-w-full"
      >
        <Disc3 aria-hidden className={cn(busy && "animate-disc")} />
        <span className="truncate" aria-live="polite">
          {stage ?? "Surprise me"}
        </span>
      </Button>
      {roll.isError ? (
        <span role="alert" className="mt-1 text-xs text-danger">
          {describeError(roll.error).body}
        </span>
      ) : null}
    </span>
  );
}
