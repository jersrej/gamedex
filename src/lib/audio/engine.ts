/**
 * GameDex sound, synthesised with the Web Audio API. No audio files, and
 * nothing sampled from real hardware — every cue is a few oscillators and a
 * noise buffer, written for this app.
 *
 * The engine is deliberately forgiving: with no Web Audio support, or while
 * the browser is still blocking audio (no user gesture yet), every call is a
 * silent no-op. The app never depends on a sound having played.
 */

export type Cue =
  | "boot"
  | "move"
  | "select"
  | "open"
  | "close"
  | "confirm"
  | "error"
  | "disc";

type Tone = {
  type: OscillatorType;
  /** Hz at the start; `to` glides there by the end. */
  from: number;
  to?: number;
  at: number;
  length: number;
  gain: number;
  attack?: number;
};

type Noise = { at: number; length: number; gain: number; lowpass: number };

type Score = { tones: Tone[]; noise?: Noise[] };

const MASTER_GAIN = 0.2;

const SCORES: Record<Cue, Score> = {
  // Power-on, written for GameDex — soft, low and short:
  //   0.00  the tube: a quiet thump and a mains hum swelling underneath
  //   0.45  the drive: a low whirr rising, with two head-seek ticks
  //   1.00  as the name appears, three bell-like notes climbing in open
  //         fifths (G–D–A), each a sine with a quieter octave above it, struck
  //         quickly and left to ring
  //   2.30  one small high ping on "system ready"
  boot: {
    noise: [
      { at: 0, length: 0.03, gain: 0.3, lowpass: 3200 },
      { at: 0.62, length: 0.02, gain: 0.12, lowpass: 3000 },
      { at: 0.8, length: 0.02, gain: 0.12, lowpass: 3800 },
    ],
    tones: [
      { type: "sine", from: 96, to: 48, at: 0, length: 0.16, gain: 0.45 },
      { type: "sine", from: 55, at: 0.05, length: 2.7, gain: 0.26, attack: 0.6 },
      { type: "triangle", from: 70, to: 190, at: 0.45, length: 0.6, gain: 0.05, attack: 0.2 },
      { type: "sine", from: 196, at: 1.0, length: 1.7, gain: 0.3, attack: 0.02 },
      { type: "sine", from: 392, at: 1.0, length: 1.1, gain: 0.09, attack: 0.02 },
      { type: "sine", from: 293.66, at: 1.28, length: 1.5, gain: 0.26, attack: 0.02 },
      { type: "sine", from: 587.33, at: 1.28, length: 1.0, gain: 0.08, attack: 0.02 },
      { type: "sine", from: 440, at: 1.56, length: 1.3, gain: 0.24, attack: 0.02 },
      { type: "sine", from: 880, at: 1.56, length: 0.9, gain: 0.07, attack: 0.02 },
      { type: "sine", from: 1760, at: 2.3, length: 0.5, gain: 0.05, attack: 0.01 },
    ],
  },
  move: { tones: [{ type: "square", from: 620, at: 0, length: 0.035, gain: 0.12 }] },
  // A key going down: a tiny mechanical tick, then the confirming blip.
  select: {
    noise: [{ at: 0, length: 0.012, gain: 0.2, lowpass: 5000 }],
    tones: [
      { type: "square", from: 520, at: 0.01, length: 0.04, gain: 0.12 },
      { type: "square", from: 780, at: 0.05, length: 0.05, gain: 0.12 },
    ],
  },
  open: {
    tones: [{ type: "triangle", from: 300, to: 620, at: 0, length: 0.12, gain: 0.3 }],
  },
  close: {
    tones: [{ type: "triangle", from: 520, to: 240, at: 0, length: 0.12, gain: 0.3 }],
  },
  confirm: {
    tones: [
      { type: "square", from: 660, at: 0, length: 0.06, gain: 0.13 },
      { type: "square", from: 880, at: 0.06, length: 0.06, gain: 0.13 },
      { type: "square", from: 1320, at: 0.12, length: 0.1, gain: 0.11 },
    ],
  },
  error: {
    tones: [
      { type: "sawtooth", from: 150, at: 0, length: 0.11, gain: 0.2 },
      { type: "sawtooth", from: 110, at: 0.13, length: 0.18, gain: 0.2 },
    ],
  },
  // A drive spinning up and seeking: a rising whirr with three head ticks.
  disc: {
    noise: [
      { at: 0.1, length: 0.03, gain: 0.25, lowpass: 3800 },
      { at: 0.22, length: 0.03, gain: 0.25, lowpass: 3200 },
      { at: 0.3, length: 0.03, gain: 0.25, lowpass: 4200 },
    ],
    tones: [
      { type: "sawtooth", from: 70, to: 210, at: 0, length: 0.45, gain: 0.08, attack: 0.1 },
    ],
  },
};

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (context) return context;
  const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!Ctor) return null;
  try {
    context = new Ctor();
  } catch {
    return null;
  }
  return context;
}

function playTone(ctx: AudioContext, out: AudioNode, start: number, tone: Tone): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const begin = start + tone.at;
  const end = begin + tone.length;
  const attack = tone.attack ?? 0.004;

  osc.type = tone.type;
  osc.frequency.setValueAtTime(tone.from, begin);
  if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, end);

  gain.gain.setValueAtTime(0.0001, begin);
  gain.gain.exponentialRampToValueAtTime(tone.gain, begin + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  osc.connect(gain).connect(out);
  osc.start(begin);
  osc.stop(end + 0.02);
}

function playNoise(ctx: AudioContext, out: AudioNode, start: number, noise: Noise): void {
  const frames = Math.ceil(ctx.sampleRate * noise.length);
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  source.buffer = buffer;
  filter.type = "lowpass";
  filter.frequency.value = noise.lowpass;
  gain.gain.value = noise.gain;

  source.connect(filter).connect(gain).connect(out);
  source.start(start + noise.at);
}

/**
 * Plays a cue if the browser will let us. Returns whether sound was actually
 * scheduled, so callers that care (the sound toggle) can tell.
 */
export function playCue(cue: Cue): boolean {
  const ctx = getContext();
  if (!ctx) return false;

  // Browsers keep the context suspended until a user gesture. Ask to resume —
  // inside a click handler this succeeds — but never wait on it.
  if (ctx.state === "suspended") void ctx.resume().catch(() => {});
  if (ctx.state !== "running") return false;

  try {
    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);

    const score = SCORES[cue];
    const start = ctx.currentTime + 0.01;
    score.tones.forEach((tone) => playTone(ctx, master, start, tone));
    score.noise?.forEach((noise) => playNoise(ctx, master, start, noise));
    return true;
  } catch {
    return false;
  }
}

/** Call from a user gesture to unlock audio for later cues. */
export function unlockAudio(): void {
  const ctx = getContext();
  if (ctx?.state === "suspended") void ctx.resume().catch(() => {});
}
