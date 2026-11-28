import { NUDGE_TOP_LEVEL, type FunEvent } from "../../shared/fun";
import type { ParticipantId } from "../../shared/protocol";

type Nudge = Pick<
  Extract<FunEvent, { kind: "nudge" }>,
  "from" | "to" | "level"
>;

/**
 * Nudges at the same Holdout that arrived while one was still playing in this browser, shown as
 * one: one shake, one toast.
 */
export interface NudgeBurst {
  to: ParticipantId;
  /** Everyone who Nudged in the burst, each once, in the order they did. */
  from: readonly ParticipantId[];
  /** The highest level in the burst. */
  level: number;
}

/** The burst with `nudge` in it, or a new burst when there's none or it was at someone else. */
export function addNudge(burst: NudgeBurst | null, nudge: Nudge): NudgeBurst {
  if (!burst || burst.to !== nudge.to)
    return { to: nudge.to, from: [nudge.from], level: nudge.level };
  return {
    to: burst.to,
    from: burst.from.includes(nudge.from)
      ? burst.from
      : [...burst.from, nudge.from],
    level: Math.max(burst.level, nudge.level),
  };
}

/**
 * The toast for a burst, as `viewer` sees it: "Ana, Caio and 3 others sent you a Nudge!" for the
 * Holdout, "You and Ana Nudged Bruno" for a sender, "Ana Nudged Bruno" for everyone else.
 */
export function burstNotice(
  burst: NudgeBurst,
  viewer: ParticipantId,
  nameOf: (id: ParticipantId) => string,
): string {
  if (burst.to === viewer)
    return `${namesPhrase(burst.from.map(nameOf))} sent you a Nudge!`;
  const names = burst.from.includes(viewer)
    ? ["You", ...burst.from.filter((id) => id !== viewer).map(nameOf)]
    : burst.from.map(nameOf);
  return `${namesPhrase(names)} Nudged ${nameOf(burst.to)}`;
}

/** "Ana", "Ana and Caio", or the first two names and how many others. */
function namesPhrase(names: readonly string[]): string {
  const [first, second] = names;
  if (names.length <= 1) return first ?? "Someone";
  if (names.length === 2) return `${first} and ${second}`;
  const others = names.length - 2;
  return `${first}, ${second} and ${others} other${others === 1 ? "" : "s"}`;
}

/**
 * How strong a Nudge at `level` is, from 0 at level 1 to 1 at the top level. Everything a Nudge
 * does grows with it together, so the build-up reads the same everywhere.
 */
export function nudgeStrength(level: number): number {
  const clamped = Math.min(Math.max(level, 1), NUDGE_TOP_LEVEL);
  return (clamped - 1) / (NUDGE_TOP_LEVEL - 1);
}

/** One back-and-forth of the shake. A longer shake plays more of them. */
export const SHAKE_CYCLE_MS = 250;

/** How the Holdout's page shakes: for how long, and how far it swings. */
export interface Shake {
  ms: number;
  px: number;
}

/**
 * How the Holdout's page shakes at a level: from a small jitter for half a second at level 1 to a
 * violent shake for a second and a half at the top level, still small enough to use the page.
 * Always a whole number of cycles.
 */
export function shakeOf(level: number): Shake {
  const strength = nudgeStrength(level);
  return {
    ms: SHAKE_CYCLE_MS * (2 + Math.round(strength * 4)),
    px: 4 + strength * 12,
  };
}

/** What the Holdout's page shouts as a Nudge's level grows, quietest first: one per level. */
const SHOUTS = ["psst", "hey", "Hey!", "HEY!!", "VOTE!!!"];

/** How far apart the words of a shout pop out. */
const SHOUT_STEP_MS = 180;
/** How long a word takes to pop in. */
export const POP_IN_MS = 300;
/** How long a word that isn't the last stays out, once popped in. */
const WORD_STAYS_MS = 170;
/** The last word stays until a little after the shake, and never less than this. */
const LAST_WORD_LINGERS_MS = 400;
const LAST_WORD_STAYS_MS = 500;

/** One word of the Holdout's shout: its size, when it pops in, and how long it then stays. */
export interface ShoutWord {
  text: string;
  rem: number;
  delayMs: number;
  staysMs: number;
}

/**
 * The words the Holdout's page shouts at `level`, in order: one more word for each level, each
 * sized for the level it belongs to, so the shout grows louder as it goes. They pop out one after
 * another, and the last one stays until a little after the shake.
 */
export function shoutOf(level: number): ShoutWord[] {
  const count = 1 + Math.round(nudgeStrength(level) * (SHOUTS.length - 1));
  return SHOUTS.slice(0, count).map((text, i) => {
    const delayMs = i * SHOUT_STEP_MS;
    const staysMs =
      i === count - 1
        ? Math.max(
            LAST_WORD_STAYS_MS,
            shakeOf(level).ms + LAST_WORD_LINGERS_MS - delayMs,
          )
        : WORD_STAYS_MS;
    return { text, rem: 3 + nudgeStrength(i + 1) * 5, delayMs, staysMs };
  });
}

/** How long one Card's hop takes, and how far behind its left neighbour it starts. */
export const HOP_MS = 360;
export const HOP_STAGGER_MS = 45;

/** How many times each of the Holdout's Cards hops at `level`: once at level 1, 4 at the top. */
export function hopWavesOf(level: number): number {
  return 1 + Math.round(nudgeStrength(level) * 3);
}

/** How long one punch of the page takes. */
export const PUNCH_MS = 420;

/** How many punches fit in the shake at `level`, so the page is back to its size when it ends. */
export function punchesOf(level: number): number {
  return Math.max(1, Math.floor(shakeOf(level).ms / PUNCH_MS));
}

/**
 * The moments the Holdout's Nudge hits at `level`, in ms from its start, for its sound to follow:
 * each word popping in, the top of each Card's hop (for a Hand of `cards` Cards), the start of each
 * punch, and the length of the shake.
 */
export interface NudgeBeats {
  level: number;
  words: { atMs: number; index: number }[];
  hopsMs: number[];
  punchesMs: number[];
  shakeMs: number;
}

/** Where a Card is highest in its hop, as a fraction of the hop. */
export const HOP_TOP = 0.4;

export function nudgeBeats(level: number, cards: number): NudgeBeats {
  const hopsMs: number[] = [];
  // Each Card hops again as soon as its last hop ends, so the waves keep their stagger.
  for (let wave = 0; wave < hopWavesOf(level); wave++)
    for (let card = 0; card < cards; card++)
      hopsMs.push(card * HOP_STAGGER_MS + wave * HOP_MS + HOP_MS * HOP_TOP);
  return {
    level,
    words: shoutOf(level).map((word, index) => ({ atMs: word.delayMs, index })),
    hopsMs: hopsMs.sort((a, b) => a - b),
    punchesMs: Array.from({ length: punchesOf(level) }, (_, i) => i * PUNCH_MS),
    shakeMs: shakeOf(level).ms,
  };
}
