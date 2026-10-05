"use client";

import { setSoundEnabled, useSoundEnabled } from "@/lib/audio/sound";
import { cn } from "@/lib/utils";

/** Global sound setting, as a two-position slide switch on the casing. */
export function SoundToggle({ className }: { className?: string }) {
  const enabled = useSoundEnabled();

  return (
    <button
      type="button"
      aria-label="Sound"
      aria-pressed={enabled}
      title={enabled ? "Sound on" : "Sound off"}
      // The store plays its own confirmation when switching on.
      data-sfx="none"
      onClick={() => setSoundEnabled(!enabled)}
      className={cn("flex min-h-10 flex-col items-center justify-center gap-1.5 p-1", className)}
    >
      <span className="switch md:mt-1.5" data-on={enabled} />
      <span className="hidden flex-col items-center gap-1 md:flex md:pt-0.5">
        <span className="printed flex items-center gap-1.5">
          <span aria-hidden className="led" data-on={enabled} />
          Sound
        </span>
        <span aria-hidden className="printed text-[0.5rem] tracking-[0.12em] opacity-70">
          Off · On
        </span>
      </span>
    </button>
  );
}
