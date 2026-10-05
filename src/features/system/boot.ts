/**
 * Boot sequence state shared between the pre-paint script, the overlay and
 * the "replay" control.
 *
 *   full  — first visit: the whole power-on sequence (~2.8s)
 *   short — returning visitor, once per browser tab session (~0.7s)
 *   off   — no overlay (reduced motion, or already booted this session)
 *
 * The mode is written to <html data-boot> by an inline script before first
 * paint, so there is no flash of the app before the boot screen and no boot
 * screen at all when JavaScript is unavailable.
 */

export type BootMode = "full" | "short" | "off";

export const BOOT_SEEN_KEY = "gamedex_boot_seen";
const SESSION_KEY = "gamedex_booted";
export const BOOT_REPLAY_EVENT = "gamedex:boot";

export const BOOT_DURATION: Record<Exclude<BootMode, "off">, number> = {
  full: 2800,
  short: 700,
};

/** Runs before hydration; must stay dependency-free and never throw. */
export const BOOT_INLINE_SCRIPT = `(function(){var m="off";try{var r=matchMedia("(prefers-reduced-motion: reduce)").matches;if(!r&&!sessionStorage.getItem("${SESSION_KEY}")){m=localStorage.getItem("${BOOT_SEEN_KEY}")?"short":"full"}}catch(e){}document.documentElement.dataset.boot=m})()`;

export function currentBootMode(): BootMode {
  const mode = document.documentElement.dataset.boot;
  return mode === "full" || mode === "short" ? mode : "off";
}

export function finishBoot(): void {
  document.documentElement.dataset.boot = "off";
  try {
    window.localStorage.setItem(BOOT_SEEN_KEY, "true");
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Without storage the sequence simply plays again next visit.
  }
}

/** Replays the full sequence on request (footer control). */
export function replayBoot(): void {
  document.documentElement.dataset.boot = "full";
  window.dispatchEvent(new Event(BOOT_REPLAY_EVENT));
}
