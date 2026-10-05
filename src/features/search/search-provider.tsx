"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { sfx } from "@/lib/audio/sound";

// The palette (cmdk + dialog) is only downloaded the first time it is opened.
const CommandSearch = dynamic(
  () => import("@/features/search/command-search").then((mod) => mod.CommandSearch),
  { ssr: false },
);

const SearchContext = createContext<{ openSearch: () => void } | null>(null);

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useSearch must be used inside <SearchProvider>");
  return context;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  const setPaletteOpen = useCallback((next: boolean) => {
    if (next) setEverOpened(true);
    else sfx("close");
    setOpen(next);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        sfx("open");
        setEverOpened(true);
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo(
    () => ({ openSearch: () => setPaletteOpen(true) }),
    [setPaletteOpen],
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      {everOpened ? <CommandSearch open={open} onOpenChange={setPaletteOpen} /> : null}
    </SearchContext.Provider>
  );
}
