import type { ParticipantId } from "./protocol.js";

/** Every Reaction a Voter can send up from their own Card. */
export const REACTIONS = ["🎉", "😱", "🤔", "🔥", "☕", "👍"] as const;

export type Reaction = (typeof REACTIONS)[number];

export function isReaction(value: unknown): value is Reaction {
  return REACTIONS.includes(value as Reaction);
}

/** Everything a Participant can Throw at another Voter's Card, by its key, with how to say it. */
export const THROWABLES = {
  "paper-ball": { emoji: "📄", phrase: "a paper ball" },
  rock: { emoji: "🪨", phrase: "a rock" },
  tomato: { emoji: "🍅", phrase: "a tomato" },
  egg: { emoji: "🥚", phrase: "an egg" },
  fish: { emoji: "🐟", phrase: "a fish" },
  flowers: { emoji: "💐", phrase: "flowers" },
} as const;

export type Throwable = keyof typeof THROWABLES;

export function isThrowable(value: unknown): value is Throwable {
  return typeof value === "string" && Object.hasOwn(THROWABLES, value);
}

/** An accepted Reaction or Throw, sent to everyone in the Room. */
export type FunEvent =
  | { kind: "reaction"; from: ParticipantId; reaction: Reaction }
  | { kind: "throw"; from: ParticipantId; to: ParticipantId; item: Throwable };

/** How many Reactions or Throws a Participant can send in a row. */
export const BURST_SIZE = 3;
/** After a burst, one more becomes available this often. */
export const BURST_REFILL_MS = 1000;

/** How many a Participant has left, as of `at` (ms). Fractions are part of the way to the next. */
export interface Burst {
  left: number;
  at: number;
}

/**
 * Spends one Reaction or Throw at `now`, or says there's none left. A Participant who hasn't sent
 * any yet (`burst` undefined) has a full burst. The server enforces this; the client runs the same
 * rule only to avoid sending what the server would refuse.
 */
export function spendBurst(
  burst: Burst | undefined,
  now: number,
): Burst | null {
  const left = burst
    ? Math.min(BURST_SIZE, burst.left + (now - burst.at) / BURST_REFILL_MS)
    : BURST_SIZE;
  return left >= 1 ? { left: left - 1, at: now } : null;
}
