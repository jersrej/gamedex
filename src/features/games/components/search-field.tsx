"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { MAX_SEARCH_LENGTH } from "@/types/game";

const DEBOUNCE_MS = 350;

function normalise(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Title search for the browse page. Typing updates the URL after a pause; the
 * field also follows the URL when it changes from elsewhere (back button,
 * "clear filters") without clobbering what is being typed.
 */
export function SearchField({
  value,
  onCommit,
}: {
  /** The search term currently in the URL. */
  value: string;
  onCommit: (term: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [seenValue, setSeenValue] = useState(value);

  // The URL changed. If it isn't just our own edit landing, adopt it.
  if (value !== seenValue) {
    setSeenValue(value);
    if (value !== normalise(input)) setInput(value);
  }

  const settled = useDebouncedValue(normalise(input), DEBOUNCE_MS);

  useEffect(() => {
    if (settled !== value && settled === normalise(input)) onCommit(settled);
    // Fire only when the typed text settles, not when the URL catches up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settled]);

  return (
    <div className="well relative min-w-0 flex-1 border border-border-strong focus-within:border-accent hover:border-accent">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-link"
      >
        &gt;
      </span>
      <input
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        maxLength={MAX_SEARCH_LENGTH}
        aria-label="Search games by title"
        placeholder="Search by title…"
        enterKeyHint="search"
        className="h-10 w-full bg-transparent pr-10 pl-8 font-mono text-base tracking-wide uppercase caret-accent outline-none placeholder:text-muted-foreground sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
      {input ? (
        <button
          type="button"
          onClick={() => {
            setInput("");
            onCommit("");
          }}
          aria-label="Clear search"
          className="absolute top-0 right-0 grid size-10 place-items-center text-muted-foreground -outline-offset-2 hover:bg-accent hover:text-accent-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
