/**
 * The buzz the Holdout hears when they're Nudged: the app's only sound. It's synthesised with the
 * Web Audio API, so there's no sound file: a low, rough hum from two slightly detuned oscillators,
 * pulsed a few times. Louder at higher levels, on the same scale as the shake.
 */
import { nudgeStrength } from "./nudge-burst";

/** How long each pulse of the buzz hums, and the gap after it. */
const PULSE_S = 0.11;
const GAP_S = 0.05;
const PULSES = 3;
/** How long each pulse takes to fade in and out, so it doesn't click. */
const EDGE_S = 0.015;
/** The volume at level 1 and at the top level. */
const QUIETEST = 0.08;
const LOUDEST = 0.25;
/** Two notes a little apart beat against each other, which makes the hum rough. */
const NOTES = [
  { type: "sawtooth", hz: 110 },
  { type: "square", hz: 116 },
] as const;
/** Takes the edge off the oscillators, so it hums rather than screeches. */
const MUFFLE_HZ = 900;
/** A buzz the browser takes longer than this to allow is dropped: it would come too late. */
const RESUME_WAIT_MS = 300;

/** Made at the first click, key press or buzz, and reused: browsers allow only a few. */
let context: AudioContext | null = null;

/** The page's AudioContext, made if need be. Null if this browser has no Web Audio. */
function audio(): AudioContext | null {
  try {
    context ??= new AudioContext();
    return context;
  } catch {
    return null;
  }
}

/**
 * Lets the buzz play later: browsers only allow sound once someone has clicked or typed on the
 * page, so the first click or key press makes the AudioContext, or wakes it.
 */
export function readyBuzz() {
  const wake = () => {
    void audio()
      ?.resume()
      .catch(() => {});
  };
  document.addEventListener("pointerdown", wake, { once: true });
  document.addEventListener("keydown", wake, { once: true });
  return () => {
    document.removeEventListener("pointerdown", wake);
    document.removeEventListener("keydown", wake);
  };
}

/**
 * Plays the buzz once, at `level`. A browser that won't play sound yet (nobody has clicked or
 * typed on the page) or at all stays silent, without an error: the Nudge goes ahead without it.
 */
export function buzz(level: number) {
  const ctx = audio();
  if (!ctx) return;
  const volume = QUIETEST + nudgeStrength(level) * (LOUDEST - QUIETEST);
  if (ctx.state === "running") {
    play(ctx, volume);
    return;
  }
  // Waking it can fail without a click or key press first: then nothing is heard.
  const asked = performance.now();
  ctx
    .resume()
    .then(() => {
      if (performance.now() - asked < RESUME_WAIT_MS) play(ctx, volume);
    })
    .catch(() => {});
}

function play(ctx: AudioContext, volume: number) {
  const start = ctx.currentTime + 0.01;
  const end = start + PULSES * (PULSE_S + GAP_S);

  const muffle = ctx.createBiquadFilter();
  muffle.type = "lowpass";
  muffle.frequency.value = MUFFLE_HZ;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  muffle.connect(gain).connect(ctx.destination);

  for (let i = 0; i < PULSES; i++) {
    const on = start + i * (PULSE_S + GAP_S);
    gain.gain.setValueAtTime(0, on);
    gain.gain.linearRampToValueAtTime(volume, on + EDGE_S);
    gain.gain.setValueAtTime(volume, on + PULSE_S - EDGE_S);
    gain.gain.linearRampToValueAtTime(0, on + PULSE_S);
  }

  let humming = NOTES.length;
  for (const { type, hz } of NOTES) {
    const oscillator = ctx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = hz;
    oscillator.connect(muffle);
    oscillator.start(start);
    oscillator.stop(end);
    oscillator.onended = () => {
      oscillator.disconnect();
      humming -= 1;
      if (humming === 0) gain.disconnect();
    };
  }
}
