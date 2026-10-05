"use client";

import { useSyncExternalStore } from "react";

import { playCue, unlockAudio, type Cue } from "@/lib/audio/engine";

/**
 * The global sound setting. Off until the visitor turns it on — browsers
 * won't play audio before a gesture anyway, and nobody should be surprised by
 * a website making noise. The choice is remembered in localStorage.
 */

export const SOUND_STORAGE_KEY = "gamedex_sound";

const listeners = new Set<() => void>();
let enabled: boolean | null = null;

function read(): boolean {
  if (enabled === null) {
    try {
      enabled = window.localStorage.getItem(SOUND_STORAGE_KEY) === "on";
    } catch {
      enabled = false;
    }
  }
  return enabled;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSoundEnabled(next: boolean): void {
  enabled = next;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Not persisted; still applies for this visit.
  }
  listeners.forEach((listener) => listener());
  if (next) {
    // The toggle click is the user gesture that lets audio start.
    unlockAudio();
    playCue("confirm");
  }
}

export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}

/** Plays a cue when sound is on; silently does nothing otherwise. */
export function sfx(cue: Cue): void {
  if (typeof window === "undefined" || !read()) return;
  playCue(cue);
}

/** Test hook. */
export function resetSoundStore(): void {
  enabled = null;
}
