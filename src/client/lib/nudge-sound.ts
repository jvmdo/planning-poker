/**
 * The alarm the Holdout hears when they're Nudged: the app's only sound. It follows the Nudge's
 * animation beat for beat, and it's meant to sound like a warning, and a bit annoying:
 *
 * - **Shout:** an air horn blast for each comic word, all on one pitch, each word louder and
 *   harsher than the last; only the last word, long enough to settle, slides into tune.
 * - **Hop:** a smoke alarm's low-battery chirp at the top of each Card's hop.
 * - **Shake and punch:** mains hum with a crackle for as long as the shake, and a wrong-answer
 *   buzzer on each punch.
 *
 * Chosen with the prototype on the `prototype/nudge-sound` branch (variant C3c). It's synthesised
 * with the Web Audio API, so there's no sound file: the horn is matched to a reference recording
 * (one reed at a flat D4, very bright, recorded into clipping, ringing on in a room after it stops).
 * Louder at higher levels, on the same scale as the shake.
 */
import { NUDGE_TOP_LEVEL } from "../../shared/fun";
import { nudgeStrength, type NudgeBeats } from "./nudge-burst";

/** A sound the browser takes longer than this to allow is dropped: it would come too late. */
const RESUME_WAIT_MS = 300;
/** The volume at level 1 and at the top level. */
const QUIETEST = 0.45;
const LOUDEST = 0.85;

/** Made at the first click, key press or Nudge, and reused: browsers allow only a few. */
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
 * Lets the alarm play later: browsers only allow sound once someone has clicked or typed on the
 * page, so the first click or key press makes the AudioContext, or wakes it.
 */
export function readyNudgeSound() {
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
 * Plays the alarm for a Nudge hitting `beats`. Returns a function that silences it at once, for a
 * burst to restart it with the animation. A browser that won't play sound yet (nobody has clicked
 * or typed on the page) or at all stays silent, without an error: the Nudge goes ahead without it.
 */
export function playNudgeSound(beats: NudgeBeats): () => void {
  const ctx = audio();
  if (!ctx) return () => {};
  let stop = () => {};
  let stopped = false;
  const start = () => {
    if (!stopped) stop = scheduleNudgeSound(ctx, ctx.destination, beats);
  };
  if (ctx.state === "running") start();
  else {
    // Waking it can fail without a click or key press first: then nothing is heard.
    const asked = performance.now();
    ctx
      .resume()
      .then(() => {
        if (performance.now() - asked < RESUME_WAIT_MS) start();
      })
      .catch(() => {});
  }
  return () => {
    stopped = true;
    stop();
  };
}

/**
 * Schedules the whole alarm on `ctx`, into `out`. Returns a function that fades it out at once.
 * Exported for rendering it offline.
 */
export function scheduleNudgeSound(
  ctx: BaseAudioContext,
  out: AudioNode,
  beats: NudgeBeats,
): () => void {
  const strength = nudgeStrength(beats.level);
  const master = ctx.createGain();
  master.gain.value = QUIETEST + strength * (LOUDEST - QUIETEST);
  // So the pile-up at the top level is loud but doesn't crackle more than it should.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12;
  limiter.ratio.value = 12;
  master.connect(limiter).connect(out);
  const mix = new Mix(ctx, master, ctx.currentTime + 0.02);
  const s = (ms: number) => ms / 1000;
  const shake = s(beats.shakeMs);

  // Shout: an air horn per word, one pitch, louder and driven harder each word.
  for (const { atMs, index } of beats.words) {
    // Only "VOTE!!!", the top level's word, is long enough to settle into tune.
    const top = index === NUDGE_TOP_LEVEL - 1;
    mix.airHorn({
      at: s(atMs),
      dur: top ? 0.8 : 0.15,
      vol: 0.08 + index * 0.05,
      drive: 0.5 + index * 0.4,
      slide: top,
    });
  }
  // Hop: a smoke alarm's chirp at the top of each Card's hop.
  for (const atMs of beats.hopsMs)
    mix.tone({ at: s(atMs), dur: 0.03, hz: 3200, vol: 0.07, type: "sine" });
  // Shake: mains hum with a crackle, as long as the shake.
  mix.tone({
    at: 0,
    dur: shake,
    hz: 60,
    vol: 0.25,
    type: "sawtooth",
    lowpass: 600,
  });
  mix.tone({
    at: 0,
    dur: shake,
    hz: 120,
    vol: 0.12,
    type: "square",
    lowpass: 600,
  });
  mix.crackle({ at: 0, dur: shake, vol: 0.1 + strength * 0.1 });
  // Punch: a wrong-answer buzzer, two notes a little apart, on each.
  for (const atMs of beats.punchesMs)
    for (const hz of [140, 147])
      mix.tone({
        at: s(atMs) + 0.03,
        dur: 0.3,
        hz,
        vol: 0.18,
        type: "sawtooth",
        lowpass: 1200,
      });

  return () => {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.04);
    setTimeout(() => limiter.disconnect(), 200);
  };
}

/** The reference horn's pitch: a flat D4. */
const HORN_HZ = 287;
/** How far off-centre the horn's reed is pushed before clipping. */
const HORN_BIAS = 0.3;
/**
 * Soft at first, then flat: the horn is recorded hot, into clipping. Lopsided, so it keeps the even
 * harmonics a sawtooth clipped evenly would lose.
 */
const HORN_CLIP = (() => {
  const curve = new Float32Array(1024);
  for (let i = 0; i < curve.length; i++) {
    const x = (i / (curve.length - 1)) * 2 - 1;
    curve[i] =
      x > 0
        ? Math.min(1, Math.tanh(x * 2.5) * 1.1)
        : Math.max(-0.7, Math.tanh(x * 1.6) * 0.8);
  }
  return curve;
})();
/**
 * Shapes the clipped reed like the reference's spectrum: a thin second harmonic, energy piled up
 * round 1.7–5 kHz with the top at 3.4 kHz, and little past 9 kHz. [type, Hz, Q, gain dB]
 */
const HORN_EQ: [BiquadFilterType, number, number, number][] = [
  ["highpass", 80, 0.7, 0],
  ["highshelf", 1300, 0.7, 10],
  ["peaking", 575, 2, -10],
  ["peaking", 1700, 1.5, 2],
  ["peaking", 3450, 1.2, 9],
  ["peaking", 5200, 1, 6],
  ["lowpass", 9000, 0.7, 0],
];

/** One-off sounds scheduled at `start + at` seconds, into `out`. */
class Mix {
  private noise: AudioBuffer | null = null;
  private roomNode: ConvolverNode | null = null;

  constructor(
    private ctx: BaseAudioContext,
    private out: AudioNode,
    private start: number,
  ) {}

  /** A steady tone, optionally muffled. */
  tone(o: {
    at: number;
    dur: number;
    hz: number;
    vol: number;
    type: OscillatorType;
    lowpass?: number;
  }) {
    const t = this.start + o.at;
    let into: AudioNode = this.envelope(t, o.dur, o.vol);
    if (o.lowpass) {
      const muffle = this.ctx.createBiquadFilter();
      muffle.type = "lowpass";
      muffle.frequency.value = o.lowpass;
      muffle.connect(into);
      into = muffle;
    }
    const osc = this.ctx.createOscillator();
    osc.type = o.type;
    osc.frequency.value = o.hz;
    osc.connect(into);
    osc.start(t);
    osc.stop(t + o.dur + 0.01);
  }

  /** Hiss above 2 kHz chopped on and off fast, like a bad wire. */
  crackle(o: { at: number; dur: number; vol: number }) {
    const { ctx } = this;
    const t = this.start + o.at;
    const chop = ctx.createGain();
    chop.gain.value = 0.5;
    chop.connect(this.envelope(t, o.dur, o.vol));
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.value = 37;
    const depth = ctx.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(chop.gain);
    lfo.start(t);
    lfo.stop(t + o.dur + 0.01);
    this.hiss(t, o.dur, 2000, chop);
  }

  /**
   * An air horn like the reference: a sawtooth driven off-centre into clipping and shaped like the
   * reference's spectrum, a puff of air as it opens, and a room ringing on after its sharp stop.
   * With `slide`, it starts a semitone sharp and settles into tune, as the reference does.
   * `drive` is how hard it's pushed into clipping, as a multiple of the reference's.
   */
  airHorn(o: {
    at: number;
    dur: number;
    vol: number;
    drive: number;
    slide: boolean;
  }) {
    const { ctx } = this;
    const t = this.start + o.at;
    const g = this.envelope(t, o.dur, o.vol);
    const send = ctx.createGain();
    send.gain.value = 1.4;
    g.connect(send).connect(this.room());

    const drive = ctx.createGain();
    drive.gain.value = 6 * o.drive;
    const clip = ctx.createWaveShaper();
    clip.curve = HORN_CLIP;
    clip.oversample = "2x";
    drive.connect(clip);
    let into: AudioNode = clip;
    for (const [type, hz, q, gain] of HORN_EQ) {
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = hz;
      filter.Q.value = q;
      filter.gain.value = gain;
      into = into.connect(filter);
    }
    const level = ctx.createGain();
    level.gain.value = 0.2;
    into.connect(level).connect(g);

    const bias = ctx.createConstantSource();
    bias.offset.value = HORN_BIAS;
    bias.connect(drive);
    bias.start(t);
    bias.stop(t + o.dur + 0.01);
    const reed = ctx.createOscillator();
    reed.type = "sawtooth";
    if (o.slide) {
      reed.frequency.setValueAtTime(HORN_HZ * 1.066, t);
      reed.frequency.exponentialRampToValueAtTime(HORN_HZ * 1.02, t + 0.06);
      reed.frequency.exponentialRampToValueAtTime(HORN_HZ, t + 0.2);
    } else reed.frequency.value = HORN_HZ;
    reed.connect(drive);
    reed.start(t);
    reed.stop(t + o.dur + 0.01);

    // The puff of air as the valve opens.
    const puffDur = Math.min(0.1, o.dur);
    const puff = ctx.createGain();
    puff.gain.setValueAtTime(o.vol * 0.35, t);
    puff.gain.exponentialRampToValueAtTime(0.001, t + puffDur);
    puff.connect(this.out);
    this.hiss(t, puffDur, 800, puff);
  }

  /** A gain that fades in and out in a few ms, so nothing clicks. */
  private envelope(t: number, dur: number, vol: number) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + Math.max(0.006, dur - 0.02));
    g.gain.linearRampToValueAtTime(0, t + dur);
    g.connect(this.out);
    return g;
  }

  /** White noise above `highpassHz`, into `into`. */
  private hiss(t: number, dur: number, highpassHz: number, into: AudioNode) {
    const { ctx } = this;
    if (!this.noise) {
      const length = ctx.sampleRate * 2;
      this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = highpassHz;
    filter.connect(into);
    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    source.connect(filter);
    source.start(t, Math.random());
    source.stop(t + dur + 0.01);
  }

  /** A small, bright room the horn rings on in: a second of decaying noise to convolve with. */
  private room() {
    if (!this.roomNode) {
      const { ctx } = this;
      const length = Math.floor(ctx.sampleRate * 1.1);
      const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const data = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++)
          data[i] = (Math.random() * 2 - 1) * Math.exp((-5 * i) / length);
      }
      this.roomNode = ctx.createConvolver();
      this.roomNode.buffer = impulse;
      this.roomNode.connect(this.out);
    }
    return this.roomNode;
  }
}
