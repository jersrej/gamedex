"use client";

import { Search } from "lucide-react";

import { DeckControl } from "@/components/console/deck-control";
import { useSearch } from "@/features/search/search-provider";

/** The console's SEARCH key. Opens the database query screen (also ⌘K / Ctrl+K). */
export function SearchButton({ className }: { className?: string }) {
  const { openSearch } = useSearch();

  return (
    <DeckControl
      label="Search"
      hint="⌘K"
      aria-label="Search games"
      aria-keyshortcuts="Meta+K Control+K"
      data-sfx="open"
      onClick={openSearch}
      className={className}
    >
      <Search aria-hidden className="size-4" />
    </DeckControl>
  );
}
