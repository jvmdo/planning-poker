import type { Card } from "./deck.js";
import type { FunEvent } from "./fun.js";

export type ParticipantId = string;

/** How long a Participant whose connection dropped keeps their place before being removed. */
export const GRACE_PERIOD_MS = 30_000;

export type ParticipantRole = "voter" | "observer";

export interface ParticipantView {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
  isFacilitator: boolean;
  hasVoted: boolean;
  /** The Card they played. Always null before the Reveal. */
  vote: Card | null;
  /** False while they're away in their grace period after their connection dropped. */
  connected: boolean;
}

/** What one Participant is allowed to see of the Room. Built per recipient, never broadcast. */
export interface RoomSnapshot {
  participants: ParticipantView[];
  /** The recipient's own Vote in this Round. Nobody else's Vote is ever in the snapshot before the Reveal. */
  myVote: Card | null;
  /** False after the Facilitator's grace period expired, until someone claims the role. */
  hasFacilitator: boolean;
  /** Identifies the Round: goes up whenever its Votes are discarded (a New Round, or a lost Facilitator). */
  round: number;
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
export type DisconnectRejectionReason = "not-in-room";
export type LeaveRejectionReason = "not-in-room";
export type ClaimFacilitatorRejectionReason =
  "not-in-room" | "facilitator-exists";
export type HandOverRejectionReason =
  "not-facilitator" | "already-facilitator" | "unknown-participant";
export type ReactRejectionReason =
  "not-in-room" | "observer-cannot-react" | "not-a-reaction" | "burst-used-up";
export type ThrowRejectionReason =
  | "not-in-room"
  | "unknown-participant"
  | "cannot-throw-at-yourself"
  | "cannot-throw-at-observer"
  | "not-throwable"
  | "burst-used-up";

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
  | { command: "becomeObserver"; reason: RoleRejectionReason }
  | { command: "handOver"; reason: HandOverRejectionReason }
  | { command: "claimFacilitator"; reason: ClaimFacilitatorRejectionReason }
  | { command: "react"; reason: ReactRejectionReason }
  | { command: "throwAt"; reason: ThrowRejectionReason };

export interface ClientToServerEvents {
  join: (id: ParticipantId, name: string) => void;
  vote: (card: number) => void;
  reveal: () => void;
  newRound: () => void;
  becomeVoter: () => void;
  becomeObserver: () => void;
  handOver: (to: ParticipantId) => void;
  claimFacilitator: () => void;
  leave: () => void;
  react: (reaction: string) => void;
  throwAt: (to: ParticipantId, item: string) => void;
}

export interface ServerToClientEvents {
  snapshot: (snapshot: RoomSnapshot) => void;
  rejected: (rejection: Rejection) => void;
  /** This browser's Participant left the Room, from this tab or another one. */
  left: () => void;
  /** A Reaction or Throw, sent to everyone. It holds no Votes, so it's the one broadcast. */
  fun: (event: FunEvent) => void;
}
