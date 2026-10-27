import type { Card } from "./deck.js";

export type ParticipantId = string;

export type ParticipantRole = "voter" | "observer";

export interface ParticipantView {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
  isFacilitator: boolean;
  hasVoted: boolean;
}

/** What one Participant is allowed to see of the Room. Built per recipient, never broadcast. */
export interface RoomSnapshot {
  participants: ParticipantView[];
  /** The recipient's own Vote in this Round. Nobody else's Vote is ever in the snapshot before the Reveal. */
  myVote: Card | null;
}

export type JoinRejectionReason = "name-empty" | "name-taken";
export type VoteRejectionReason = "not-in-room" | "card-not-in-deck";

/** What a Room command returns: success, or the reason it was refused (the Room is then unchanged). */
export type CommandResult<Reason extends string> =
  { ok: true } | { ok: false; reason: Reason };

/** A refused command, sent only to the socket that sent it. */
export type Rejection =
  | { command: "join"; reason: JoinRejectionReason }
  | { command: "vote"; reason: VoteRejectionReason };

export interface ClientToServerEvents {
  join: (id: ParticipantId, name: string) => void;
  vote: (card: number) => void;
}

export interface ServerToClientEvents {
  snapshot: (snapshot: RoomSnapshot) => void;
  rejected: (rejection: Rejection) => void;
}
