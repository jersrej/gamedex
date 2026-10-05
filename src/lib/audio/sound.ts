"use client";

import { useSyncExternalStore } from "react";

import { playCue, unlockAudio, type Cue } from "@/lib/audio/engine";

/**
 * The global volume setting: 0 (muted) to MAX_VOLUME, remembered in
 * localStorage. Sound is on by default — though browsers will not play
 * anything until the visitor has clicked or pressed a key, so the first cue
 * is only ever heard after a gesture.
 */

export const VOLUME_STORAGE_KEY = "gamedex_volume";
export const MAX_VOLUME = 10;
export const DEFAULT_VOLUME = 6;

/** Fired on every volume key press, including presses at either end stop. */
export const VOLUME_EVENT = "gamedex:volume";

/** The earlier on/off setting. Someone who switched sound off stays muted. */
const LEGACY_KEY = "gamedex_sound";

const listeners = new Set<() => void>();
let level: number | null = null;

function read(): number {
  if (level === null) {
    level = DEFAULT_VOLUME;
    try {
      const stored = window.localStorage.getItem(VOLUME_STORAGE_KEY);
      const parsed = stored === null ? NaN : Number(stored);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_VOLUME) level = parsed;
      else if (window.localStorage.getItem(LEGACY_KEY) === "off") level = 0;
    } catch {
      // Storage unavailable: the default applies for this visit.
    }
  }
  return level;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setVolume(next: number): void {
  level = Math.max(0, Math.min(MAX_VOLUME, Math.round(next)));
  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(level));
  } catch {
    // Not persisted; still applies for this visit.
  }
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new Event(VOLUME_EVENT));

  if (level > 0) {
    // The key press is a user gesture, so this is also what unlocks audio.
    unlockAudio();
    // A tick at the new level, so the change can be heard as well as seen.
    playCue("move", level / MAX_VOLUME);
  }
}

/** One step up (+1) or down (-1). */
export function stepVolume(delta: 1 | -1): void {
  setVolume(read() + delta);
}

export function useVolume(): number {
  // The server renders the default; the stored level takes over after hydration.
  return useSyncExternalStore(subscribe, read, () => DEFAULT_VOLUME);
}

/** Plays a cue at the current volume; silently does nothing when muted. */
export function sfx(cue: Cue): void {
  if (typeof window === "undefined") return;
  const current = read();
  if (current === 0) return;
  playCue(cue, current / MAX_VOLUME);
}

/** Test hook. */
export function resetSoundStore(): void {
  level = null;
}
