import type { Card, Deck } from "./deck.js";
import type { ParticipantId } from "./protocol.js";

/** How a Round's Votes came out, read against the Deck after the Reveal. */
export type Agreement =
  | { kind: "too-few" }
  | { kind: "everyone-agrees" }
  /** Every Vote is within one Card of the same Card. */
  | { kind: "nearly-agrees" }
  /** The Outliers, lowest Vote first. */
  | { kind: "outliers"; outliers: ParticipantId[] }
  /** The two Cards that tie for most, lowest first. */
  | { kind: "split"; camps: [Card, Card] }
  | { kind: "no-consensus"; lowest: Card; highest: Card };

/**
 * How the Votes cast came out. A step is the next Card in `deck`, which holds every Vote.
 *
 * With a majority Card (the one Card with the most Votes, holding at least half), every Voter two
 * or more steps from it is an Outlier; with none, nearly everyone agrees. Without a majority Card:
 * a Split if two Cards two or more steps apart tie for most and every Vote is within one step of
 * one; nearly everyone agrees if every Vote is within one step of a Card someone played; otherwise
 * no consensus.
 */
export function agreementOf(
  votes: readonly { id: ParticipantId; vote: Card }[],
  deck: Deck,
): Agreement {
  if (votes.length < 2) return { kind: "too-few" };

  const indexInDeck = (card: Card) => deck.indexOf(card);
  /** Within one step of each other. */
  const near = (a: Card, b: Card) =>
    Math.abs(indexInDeck(a) - indexInDeck(b)) <= 1;
  const counts = new Map<Card, number>();
  for (const { vote } of votes) counts.set(vote, (counts.get(vote) ?? 0) + 1);
  const played = [...counts.keys()].sort((a, b) => a - b);
  if (played.length === 1) return { kind: "everyone-agrees" };

  const most = Math.max(...counts.values());
  const top = played.filter((card) => counts.get(card) === most);
  const [first, second] = top;
  const lowest = played[0];
  const highest = played[played.length - 1];
  if (first === undefined || lowest === undefined || highest === undefined)
    throw new Error("unreachable: at least two Cards were played");

  if (top.length === 1 && most * 2 >= votes.length) {
    const outliers = votes
      .filter((v) => !near(v.vote, first))
      .sort((a, b) => a.vote - b.vote)
      .map((v) => v.id);
    return outliers.length === 0
      ? { kind: "nearly-agrees" }
      : { kind: "outliers", outliers };
  }

  if (
    top.length === 2 &&
    second !== undefined &&
    !near(first, second) &&
    played.every((card) => near(card, first) || near(card, second))
  )
    return { kind: "split", camps: [first, second] };

  if (played.some((centre) => played.every((card) => near(card, centre))))
    return { kind: "nearly-agrees" };

  return { kind: "no-consensus", lowest, highest };
}
