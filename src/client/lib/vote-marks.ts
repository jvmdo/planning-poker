import { useState } from "react";
import type { Card, Deck } from "../../shared/deck";
import type { ParticipantId, RoomSnapshot } from "../../shared/protocol";
import { agreementOf, type Agreement } from "../../shared/agreement";

/** How a revealed Card stands out: an Outlier, or one of the two camps of a Split. */
export type VoteMark = "outlier" | "camp-low" | "camp-high";

/** Each mark's colour, shared by the Cards and the breakdown's bars so they match. */
export const MARK_COLOURS: Record<VoteMark, { fill: string; ring: string }> = {
  outlier: { fill: "bg-pop-1", ring: "ring-pop-1" },
  "camp-low": { fill: "bg-pop-2", ring: "ring-pop-2" },
  "camp-high": { fill: "bg-pop-5", ring: "ring-pop-5" },
};

/** How the revealed Votes came out, and which Cards to mark. */
export interface RoundReading {
  agreement: Agreement;
  /** The Outliers' names as they were when read, lowest Vote first. */
  outlierNames: string[];
  markOfCard: (card: Card) => VoteMark | null;
  markOf: (id: ParticipantId) => VoteMark | null;
}

/** A revealed Vote, with its Voter's name as it was when it was read. */
interface ReadVote {
  id: ParticipantId;
  name: string;
  vote: Card;
}

/** A reading taken at the Reveal of one Round, with the Votes it was read from. */
export interface KeptReading {
  round: number;
  votes: ReadVote[];
  reading: RoundReading;
}

/** Before the Reveal nothing is said and nothing is marked. */
const NOTHING: RoundReading = {
  agreement: { kind: "too-few" },
  outlierNames: [],
  markOfCard: () => null,
  markOf: () => null,
};

/**
 * The reading to show, taken at the Reveal and kept until the Round changes, so Voters who leave
 * or turn Observer afterwards don't change who is asked. A Vote that comes back after the Reveal
 * (its Voter rejoined) is added and the Votes read again. A page opened after the Reveal reads the
 * Votes still there.
 */
export function keepReading(
  kept: KeptReading | null,
  snapshot: RoomSnapshot,
): KeptReading | null {
  if (!snapshot.revealed) return null;
  const current = revealedVotes(snapshot);
  if (kept?.round !== snapshot.round)
    return read(snapshot.round, current, snapshot);

  const back = current.filter((v) => !kept.votes.some((k) => k.id === v.id));
  if (back.length === 0) return kept;
  return read(snapshot.round, [...kept.votes, ...back], snapshot);
}

function revealedVotes(snapshot: RoomSnapshot): ReadVote[] {
  return snapshot.participants.flatMap((p) =>
    p.role === "voter" && p.vote !== null
      ? [{ id: p.id, name: p.name, vote: p.vote }]
      : [],
  );
}

function read(
  round: number,
  votes: ReadVote[],
  snapshot: RoomSnapshot,
): KeptReading {
  return { round, votes, reading: readingOf(votes, snapshot.deck) };
}

/** The Round's reading, kept from the Reveal to the next Round. */
export function useRoundReading(snapshot: RoomSnapshot | null): RoundReading {
  const [kept, setKept] = useState<KeptReading | null>(null);
  const next = snapshot ? keepReading(kept, snapshot) : null;
  if (next !== kept) setKept(next);
  return next?.reading ?? NOTHING;
}

/** How `votes` came out on `deck`, and which Cards to mark. */
function readingOf(votes: ReadVote[], deck: Deck): RoundReading {
  const agreement = agreementOf(votes, deck);
  const voteOf = new Map(votes.map((v) => [v.id, v.vote]));
  // Everyone on the same Card shares its mark.
  const marks = new Map<Card, VoteMark>();
  if (agreement.kind === "outliers")
    for (const id of agreement.outliers) {
      const vote = voteOf.get(id);
      if (vote !== undefined) marks.set(vote, "outlier");
    }
  if (agreement.kind === "split") {
    marks.set(agreement.camps[0], "camp-low");
    marks.set(agreement.camps[1], "camp-high");
  }

  const markOfCard = (card: Card) => marks.get(card) ?? null;
  return {
    agreement,
    outlierNames:
      agreement.kind === "outliers"
        ? agreement.outliers.map(
            (id) => votes.find((v) => v.id === id)?.name ?? "",
          )
        : [],
    markOfCard,
    markOf: (id) => {
      const vote = voteOf.get(id);
      return vote === undefined ? null : markOfCard(vote);
    },
  };
}

/** A label with ", Outlier" added for an Outlier's Card, so it isn't told by colour alone. */
export function withMarkLabel(label: string, mark: VoteMark | null) {
  return mark === "outlier" ? `${label}, Outlier` : label;
}
