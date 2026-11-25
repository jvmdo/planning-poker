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
