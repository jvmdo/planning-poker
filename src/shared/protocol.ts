import type { Card } from "./deck.js";

export type ParticipantId = string;

export type ParticipantRole = "voter" | "observer";

export interface ParticipantView {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
  isFacilitator: boolean;
  hasVoted: boolean;
  /** The Card they played. Always null before the Reveal. */
  vote: Card | null;
}

/** What one Participant is allowed to see of the Room. Built per recipient, never broadcast. */
export interface RoomSnapshot {
  participants: ParticipantView[];
  /** The recipient's own Vote in this Round. Nobody else's Vote is ever in the snapshot before the Reveal. */
  myVote: Card | null;
  revealed: boolean;
  /** The mean of the Votes cast, to one decimal place. Null until the Reveal. */
  result: number | null;
}

export type JoinRejectionReason = "name-empty" | "name-taken";
export type VoteRejectionReason =
  | "not-in-room"
  | "observer-cannot-vote"
  | "card-not-in-deck"
  | "round-revealed";
export type RevealRejectionReason =
  "not-facilitator" | "no-votes" | "already-revealed";
export type NewRoundRejectionReason = "not-facilitator";
export type RoleRejectionReason = "not-in-room";

/** What a Room command returns: success, or the reason it was refused (the Room is then unchanged). */
export type CommandResult<Reason extends string> =
  { ok: true } | { ok: false; reason: Reason };

/** A refused command, sent only to the socket that sent it. */
export type Rejection =
  | { command: "join"; reason: JoinRejectionReason }
  | { command: "vote"; reason: VoteRejectionReason }
  | { command: "reveal"; reason: RevealRejectionReason }
  | { command: "newRound"; reason: NewRoundRejectionReason }
  | { command: "becomeVoter"; reason: RoleRejectionReason }
  | { command: "becomeObserver"; reason: RoleRejectionReason };

export interface ClientToServerEvents {
  join: (id: ParticipantId, name: string) => void;
  vote: (card: number) => void;
  reveal: () => void;
  newRound: () => void;
  becomeVoter: () => void;
  becomeObserver: () => void;
}

export interface ServerToClientEvents {
  snapshot: (snapshot: RoomSnapshot) => void;
  rejected: (rejection: Rejection) => void;
}
