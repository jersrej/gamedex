import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VolumeControl } from "@/features/system/volume-control";
import { VolumeOsd } from "@/features/system/volume-osd";

import * as engine from "./engine";
import {
  DEFAULT_VOLUME,
  MAX_VOLUME,
  VOLUME_STORAGE_KEY,
  resetSoundStore,
  setVolume,
  sfx,
  stepVolume,
} from "./sound";

beforeEach(() => {
  resetSoundStore();
});

describe("volume setting", () => {
  it("is on by default, at the default level", () => {
    const play = vi.spyOn(engine, "playCue").mockReturnValue(true);

    sfx("select");

    expect(play).toHaveBeenCalledWith("select", DEFAULT_VOLUME / MAX_VOLUME);
  });

  it("plays cues at the chosen level and remembers it", () => {
    const play = vi.spyOn(engine, "playCue").mockReturnValue(true);

    setVolume(3);
    sfx("open");

    expect(window.localStorage.getItem(VOLUME_STORAGE_KEY)).toBe("3");
    expect(play).toHaveBeenLastCalledWith("open", 0.3);

    resetSoundStore(); // a later visit reads the stored level
    sfx("close");
    expect(play).toHaveBeenLastCalledWith("close", 0.3);
  });

  it("is silent at zero", () => {
    const play = vi.spyOn(engine, "playCue").mockReturnValue(true);
    setVolume(0);
    play.mockClear();

    sfx("select");

    expect(window.localStorage.getItem(VOLUME_STORAGE_KEY)).toBe("0");
    expect(play).not.toHaveBeenCalled();
  });

  it("stops at both ends of the range", () => {
    vi.spyOn(engine, "playCue").mockReturnValue(true);

    setVolume(MAX_VOLUME);
    stepVolume(1);
    expect(window.localStorage.getItem(VOLUME_STORAGE_KEY)).toBe(String(MAX_VOLUME));

    setVolume(0);
    stepVolume(-1);
    expect(window.localStorage.getItem(VOLUME_STORAGE_KEY)).toBe("0");
  });

  it("keeps someone muted who had switched sound off before volume existed", () => {
    const play = vi.spyOn(engine, "playCue").mockReturnValue(true);
    window.localStorage.setItem("gamedex_sound", "off");

    sfx("select");

    expect(play).not.toHaveBeenCalled();
  });

  it("ignores a corrupt stored level", () => {
    const play = vi.spyOn(engine, "playCue").mockReturnValue(true);
    window.localStorage.setItem(VOLUME_STORAGE_KEY, "loud");

    sfx("select");

    expect(play).toHaveBeenCalledWith("select", DEFAULT_VOLUME / MAX_VOLUME);
  });

  it("never throws where Web Audio does not exist", () => {
    // jsdom has no AudioContext — the same situation as an unsupported browser.
    expect(engine.playCue("boot")).toBe(false);
    expect(() => {
      setVolume(8);
      sfx("error");
    }).not.toThrow();
  });
});

describe("volume keys and on-screen display", () => {
  it("steps the level and shows the volume bar, then hides it", async () => {
    vi.spyOn(engine, "playCue").mockReturnValue(true);
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <>
        <VolumeControl />
        <VolumeOsd />
      </>,
    );

    // Nothing on screen until a key is pressed.
    expect(screen.getByRole("status", { hidden: true })).not.toBeVisible();

    await user.click(screen.getByRole("button", { name: "Volume up" }));

    const osd = screen.getByRole("status");
    expect(osd).toBeVisible();
    expect(osd).toHaveTextContent(`Volume0${DEFAULT_VOLUME + 1} of ${MAX_VOLUME}`);
    expect(window.localStorage.getItem(VOLUME_STORAGE_KEY)).toBe(String(DEFAULT_VOLUME + 1));

    await user.click(screen.getByRole("button", { name: "Volume down" }));
    await user.click(screen.getByRole("button", { name: "Volume down" }));
    expect(osd).toHaveTextContent(`Volume0${DEFAULT_VOLUME - 1}`);

    act(() => vi.advanceTimersByTime(2100));
    expect(osd).not.toBeVisible();

    vi.useRealTimers();
  });

  it("reads MUTE at zero", async () => {
    vi.spyOn(engine, "playCue").mockReturnValue(true);
    render(
      <>
        <VolumeControl />
        <VolumeOsd />
      </>,
    );
    act(() => setVolume(1));

    await userEvent.click(screen.getByRole("button", { name: "Volume down" }));

    expect(screen.getByRole("status")).toHaveTextContent("Mute00");
  });
});
