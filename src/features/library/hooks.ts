"use client";

import { useMemo, useSyncExternalStore } from "react";

import {
  getServerSnapshot,
  getSnapshot,
  subscribe,
  type LibraryEntry,
} from "@/features/library/store";

function useLibraryState() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useLibraryEntry(gameId: number): LibraryEntry | undefined {
  return useLibraryState()[gameId];
}

/** Every saved game, most recently changed first. */
export function useLibrary(): LibraryEntry[] {
  const state = useLibraryState();
  return useMemo(
    () => Object.values(state).sort((a, b) => b.updatedAt - a.updatedAt),
    [state],
  );
}

/**
 * False during server render and hydration, true once the browser's saved
 * library can be read — lets the library page avoid flashing "empty".
 */
export function useLibraryReady(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
