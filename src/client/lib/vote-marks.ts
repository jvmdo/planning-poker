import { useState } from "react";
import type { Card } from "../../shared/deck";
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
  /** The Outliers' names as they were at the Reveal, lowest Vote first. */
  outlierNames: string[];
  markOfCard: (card: Card) => VoteMark | null;
  markOf: (id: ParticipantId) => VoteMark | null;
}

/** A reading taken at the Reveal of one Round. */
export interface KeptReading {
  round: number;
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
 * or turn Observer afterwards don't change who is asked. A page opened after the Reveal reads the
 * Votes still there.
 */
export function keepReading(
  kept: KeptReading | null,
  snapshot: RoomSnapshot,
): KeptReading | null {
  if (!snapshot.revealed) return null;
  if (kept?.round === snapshot.round) return kept;
  return { round: snapshot.round, reading: readRound(snapshot) };
}

/** The Round's reading, kept from the Reveal to the next Round. */
export function useRoundReading(snapshot: RoomSnapshot | null): RoundReading {
  const [kept, setKept] = useState<KeptReading | null>(null);
  const next = snapshot ? keepReading(kept, snapshot) : null;
  if (next !== kept) setKept(next);
  return next?.reading ?? NOTHING;
}

/** Reads the revealed Votes as they are now. */
function readRound(snapshot: RoomSnapshot): RoundReading {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const votes = voters.flatMap((p) =>
    p.vote !== null ? [{ id: p.id, vote: p.vote }] : [],
  );
  const agreement = agreementOf(votes, snapshot.deck);
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
            (id) => voters.find((p) => p.id === id)?.name ?? "",
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
