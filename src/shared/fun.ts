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

/** How many can be sent in a row, and how often one more becomes available after that. */
export interface BurstRule {
  size: number;
  refillMs: number;
}

/** Reactions and Throws share one budget: 3 in a row, then one more every 300 ms. */
export const FUN_BURST: BurstRule = { size: 3, refillMs: 300 };

/** How many a Participant has left, as of `at` (ms). Fractions are part of the way to the next. */
export interface Burst {
  left: number;
  at: number;
}

/**
 * Spends one of a budget (Reactions and Throws by default) at `now`, or says there's none left. A
 * Participant who hasn't sent any yet (`burst` undefined) has a full burst. The server enforces
 * this; the client runs the same rule only to avoid sending what the server would refuse.
 */
export function spendBurst(
  burst: Burst | undefined,
  now: number,
  rule: BurstRule = FUN_BURST,
): Burst | null {
  const left = burst
    ? Math.min(rule.size, burst.left + (now - burst.at) / rule.refillMs)
    : rule.size;
  return left >= 1 ? { left: left - 1, at: now } : null;
}
