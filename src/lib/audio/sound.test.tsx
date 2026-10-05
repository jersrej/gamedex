import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SoundToggle } from "@/features/system/sound-toggle";

import * as engine from "./engine";
import { SOUND_STORAGE_KEY, resetSoundStore, setSoundEnabled, sfx } from "./sound";

beforeEach(() => {
  resetSoundStore();
});

describe("sound setting", () => {
  it("is off until the visitor turns it on", () => {
    const play = vi.spyOn(engine, "playCue");

    sfx("select");

    expect(play).not.toHaveBeenCalled();
  });

  it("plays cues once enabled and remembers the choice", () => {
    const play = vi.spyOn(engine, "playCue").mockReturnValue(true);

    setSoundEnabled(true);
    sfx("open");

    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe("on");
    expect(play).toHaveBeenCalledWith("open");

    resetSoundStore(); // a later visit reads the stored preference
    sfx("close");
    expect(play).toHaveBeenLastCalledWith("close");
  });

  it("goes quiet again when switched off", () => {
    const play = vi.spyOn(engine, "playCue").mockReturnValue(true);
    setSoundEnabled(true);
    setSoundEnabled(false);
    play.mockClear();

    sfx("select");

    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe("off");
    expect(play).not.toHaveBeenCalled();
  });

  it("never throws where Web Audio does not exist", () => {
    // jsdom has no AudioContext — the same situation as an unsupported browser.
    expect(engine.playCue("boot")).toBe(false);
    expect(() => {
      setSoundEnabled(true);
      sfx("error");
    }).not.toThrow();
  });
});

describe("SoundToggle", () => {
  it("is a real toggle button that reflects and changes the setting", async () => {
    vi.spyOn(engine, "playCue").mockReturnValue(true);
    render(<SoundToggle />);

    const toggle = screen.getByRole("button", { name: "Sound" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem(SOUND_STORAGE_KEY)).toBe("on");
  });
});
