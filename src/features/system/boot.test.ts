import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BOOT_INLINE_SCRIPT,
  BOOT_REPLAY_EVENT,
  BOOT_SEEN_KEY,
  currentBootMode,
  finishBoot,
  replayBoot,
} from "./boot";

/** Runs the pre-paint script the way the browser would, before any React code. */
function runInlineScript(reducedMotion = false) {
  vi.stubGlobal("matchMedia", () => ({ matches: reducedMotion }));
  new Function(BOOT_INLINE_SCRIPT)();
}

beforeEach(() => {
  window.sessionStorage.clear();
  delete document.documentElement.dataset.boot;
});

describe("boot mode", () => {
  it("plays the full sequence on a first visit", () => {
    runInlineScript();
    expect(currentBootMode()).toBe("full");
  });

  it("plays the short sequence for a returning visitor in a new session", () => {
    window.localStorage.setItem(BOOT_SEEN_KEY, "true");
    runInlineScript();
    expect(currentBootMode()).toBe("short");
  });

  it("does not boot again within the same session", () => {
    runInlineScript();
    finishBoot();
    runInlineScript();

    expect(currentBootMode()).toBe("off");
    expect(window.localStorage.getItem(BOOT_SEEN_KEY)).toBe("true");
  });

  it("is skipped entirely when the visitor prefers reduced motion", () => {
    runInlineScript(true);
    expect(currentBootMode()).toBe("off");
  });

  it("stays off when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    runInlineScript();
    expect(currentBootMode()).toBe("off");
  });

  it("can be replayed on request", () => {
    const listener = vi.fn();
    window.addEventListener(BOOT_REPLAY_EVENT, listener);
    finishBoot();

    replayBoot();

    expect(currentBootMode()).toBe("full");
    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener(BOOT_REPLAY_EVENT, listener);
  });
});
