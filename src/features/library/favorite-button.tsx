"use client";

import { Heart } from "lucide-react";

import { useLibraryEntry } from "@/features/library/hooks";
import { toggleFavorite, type LibraryGame } from "@/features/library/store";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  game,
  showLabel = false,
  className,
}: {
  game: LibraryGame;
  showLabel?: boolean;
  className?: string;
}) {
  const favorite = useLibraryEntry(game.id)?.favorite ?? false;

  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-label={showLabel ? undefined : `Favorite ${game.title}`}
      data-active={favorite}
      data-sfx="confirm"
      onClick={() => toggleFavorite(game)}
      className={cn(
        "inline-flex h-10 min-w-10 items-center justify-center gap-2 border font-sans text-[0.8125rem] leading-none font-medium tracking-[0.16em] uppercase",
        // Latched: stays lit blue while the game is a favorite.
        favorite
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border-strong bg-background text-foreground hover:border-accent",
        showLabel && "px-4",
        className,
      )}
    >
      <Heart
        aria-hidden
        // Re-keyed so the pop replays each time a favourite is added.
        key={String(favorite)}
        className={cn("size-4", favorite && "animate-pop fill-current")}
      />
      {showLabel ? (favorite ? "Favorited" : "Favorite") : null}
    </button>
  );
}
