import { beforeEach, describe, expect, it, vi } from "vitest";

import { game } from "@/test/fixtures";

import {
  STORAGE_KEY,
  getSnapshot,
  removeFromLibrary,
  resetLibraryStore,
  setStatus,
  subscribe,
  toggleFavorite,
} from "./store";

const elden = game();
const hades = game({ id: 2, slug: "hades", title: "Hades" });

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");

beforeEach(() => {
  resetLibraryStore();
});

describe("library store", () => {
  it("adds and removes favorites", () => {
    toggleFavorite(elden);
    expect(getSnapshot()[elden.id]).toMatchObject({ favorite: true, status: null });

    toggleFavorite(elden);
    expect(getSnapshot()[elden.id]).toBeUndefined();
  });

  it("tracks status independently of favorites", () => {
    toggleFavorite(elden);
    setStatus(elden, "playing");
    toggleFavorite(elden);

    expect(getSnapshot()[elden.id]).toMatchObject({ favorite: false, status: "playing" });

    setStatus(elden, null);
    expect(getSnapshot()[elden.id]).toBeUndefined();
  });

  it("stores only the fields the library needs", () => {
    setStatus(elden, "want");

    expect(stored()[elden.id].game).toEqual({
      id: 1,
      slug: "elden-ring",
      title: "Elden Ring",
      coverImage: null,
      releaseDate: "2022-02-25",
    });
  });

  it("persists across a reload", () => {
    toggleFavorite(elden);
    setStatus(hades, "completed");

    resetLibraryStore(); // a fresh page load reads storage again

    expect(Object.keys(getSnapshot())).toHaveLength(2);
    expect(getSnapshot()[hades.id]?.status).toBe("completed");
  });

  it("removes a game outright", () => {
    toggleFavorite(elden);
    setStatus(elden, "dropped");
    removeFromLibrary(elden);

    expect(getSnapshot()).toEqual({});
  });

  it("notifies subscribers and keeps a stable snapshot between changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);

    const before = getSnapshot();
    expect(getSnapshot()).toBe(before);

    toggleFavorite(elden);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(getSnapshot()).not.toBe(before);

    unsubscribe();
    toggleFavorite(hades);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("starts empty when storage holds junk", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(getSnapshot()).toEqual({});

    resetLibraryStore();
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ 1: { game: { id: "x" } }, 2: { game: hades, favorite: true, status: null, updatedAt: 1 } }),
    );
    expect(Object.keys(getSnapshot())).toEqual(["2"]);
  });

  it("picks up changes made in another tab", () => {
    const listener = vi.fn();
    const unsubscribe = subscribe(listener);
    expect(getSnapshot()).toEqual({});

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ 2: { game: hades, favorite: true, status: null, updatedAt: 1 } }),
    );
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));

    expect(listener).toHaveBeenCalled();
    expect(getSnapshot()[hades.id]?.favorite).toBe(true);
    unsubscribe();
  });
});
