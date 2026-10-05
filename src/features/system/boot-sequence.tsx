"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

import {
  BOOT_DURATION,
  BOOT_REPLAY_EVENT,
  currentBootMode,
  finishBoot,
  type BootMode,
} from "@/features/system/boot";
import { Signature } from "@/features/system/signature";
import { Wordmark, WordmarkDescriptor } from "@/features/system/wordmark";
import { sfx } from "@/lib/audio/sound";

// The self-test read-out. Each line settles on its own beat.
const CHECKS = [
  { name: "Memory", at: 1.5 },
  { name: "Database", at: 1.66 },
  { name: "Disc", at: 1.82 },
  { name: "Display", at: 1.98 },
];

const at = (seconds: number) => ({ "--at": `${seconds}s` }) as CSSProperties;

/**
 * Power-on sequence, played on the console's display. A black screen and a
 * great deal of empty space: the four signature bars grow in, the name fades
 * up beneath them, the unit runs its self-test, and the system is ready.
 * Purely presentational — the app underneath is already rendered and loading,
 * so skipping (click, Enter, Escape, Space or the button) costs nothing.
 *
 * The markup is identical for every mode and the timeline is CSS keyed off
 * <html data-boot>, so the sequence starts with the very first paint — before
 * React has hydrated. This component only decides when to leave.
 */
export function BootSequence() {
  const [mode, setMode] = useState<BootMode>("off");
  // Bumped on replay only, to restart the CSS animations.
  const [run, setRun] = useState(0);

  const end = useCallback(() => {
    finishBoot();
    setMode("off");
  }, []);

  useEffect(() => {
    const sync = () => setMode(currentBootMode());
    const replay = () => {
      setRun((current) => current + 1);
      sync();
      sfx("boot");
    };
    sync();
    // Audible only if sound is on and the browser already allows audio.
    if (currentBootMode() === "full") sfx("boot");

    window.addEventListener(BOOT_REPLAY_EVENT, replay);
    return () => window.removeEventListener(BOOT_REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    if (mode === "off") return;

    const timer = window.setTimeout(end, BOOT_DURATION[mode]);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape" || event.key === " ") {
        event.preventDefault();
        end();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [mode, run, end]);

  return (
    // Below the CRT layer (z-90) on purpose: the tube draws the boot screen too.
    <div className="boot z-[80] place-items-center bg-black" onClick={end}>
      <div key={run} className="boot-tube relative grid size-full place-items-center bg-black">
        <div className="flex flex-col items-center px-6 text-center">
          <Signature animated className="h-9 w-16 sm:h-11 sm:w-20" />

          <p className="boot-in mt-8 text-white drop-shadow-[0_0_14px_rgb(255_255_255/0.35)]" style={at(1.0)}>
            <span className="sr-only">GameDex</span>
            <Wordmark className="h-9 sm:h-14" />
          </p>
          <p className="boot-in mt-4 text-[#9c9ea8]" style={at(1.12)}>
            <span className="sr-only">Game Database System</span>
            <WordmarkDescriptor className="h-2 sm:h-2.5" />
          </p>

          <div
            role="status"
            className="mt-10 flex h-28 w-60 flex-col gap-1 font-mono text-sm tracking-widest text-[#9c9ea8] uppercase"
          >
            {CHECKS.map((check) => (
              <p key={check.name} className="boot-in boot-full flex items-baseline gap-2" style={at(check.at)}>
                <span>{check.name}</span>
                <span aria-hidden className="h-0 flex-1 border-b border-dotted border-[#4b4e5a]" />
                <span className="text-success">OK</span>
              </p>
            ))}
            <p className="boot-in mt-auto text-center tracking-[0.3em] text-white" style={at(2.3)}>
              System ready
            </p>
          </div>
        </div>

        <button
          type="button"
          data-sfx="none"
          onClick={end}
          className="pixel absolute right-4 bottom-4 px-3 py-2 text-[#9c9ea8] hover:text-white"
        >
          Skip <span aria-hidden>[Enter]</span>
        </button>
      </div>
    </div>
  );
}
