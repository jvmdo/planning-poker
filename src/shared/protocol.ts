import type { Card, Deck, InvalidDeckReason } from "./deck.js";
import type { FunEvent } from "./fun.js";
import type { GhostMove, GhostView } from "./ghost.js";

export type ParticipantId = string;

/** The name of a Room, as it appears in its URL. */
export type RoomId = string;

/** How long a Participant whose connection dropped keeps their place before being removed. */
export const GRACE_PERIOD_MS = 30_000;

/** How long Auto Reveal waits, once every Voter has voted, before it Reveals the Round. */
export const AUTO_REVEAL_DELAY_MS = 3_000;

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
  /** An Observer's Ghost while it's out, the same for everyone. Always null for a Voter. */
  ghost: GhostView | null;
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
  /** The Cards Voters choose from, set by the Facilitator. */
  deck: Deck;
  /** Whether the Room Reveals itself once every Voter has voted. */
  autoReveal: boolean;
  /** Auto Reveal is counting down to the Reveal (AUTO_REVEAL_DELAY_MS from when this turned true). */
  countingDown: boolean;
}

export type JoinRejectionReason =
  "name-empty" | "name-taken" | "room-full" | "server-full";
export type VoteRejectionReason =
  | "not-in-room"
  | "observer-cannot-vote"
  | "card-not-in-deck"
  | "round-revealed";
export type RevealRejectionReason =
  "not-facilitator" | "no-votes" | "already-revealed";
export type NewRoundRejectionReason = "not-facilitator";
export type SetDeckRejectionReason =
  "not-facilitator" | "deck-unchanged" | InvalidDeckReason;
export type SetAutoRevealRejectionReason =
  "not-facilitator" | "auto-reveal-unchanged";
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
export type NudgeRejectionReason =
  | "not-in-room"
  | "cannot-nudge-yourself"
  | "not-the-holdout"
  | "holdout-away"
  | "nudge-cooling-down";
export type SummonGhostRejectionReason =
  | "not-in-room"
  | "voter-cannot-have-ghost"
  | "not-a-skin"
  | "ghost-already-out";
export type DressGhostRejectionReason =
  "not-in-room" | "no-ghost" | "not-a-skin";
export type DismissGhostRejectionReason = "not-in-room" | "no-ghost";
export type MoveGhostRejectionReason =
  "not-in-room" | "no-ghost" | "not-a-point" | "moves-used-up";

/** What a Room command returns: success, or the reason it was refused (the Room is then unchanged). */
export type CommandResult<Reason extends string> =
  { ok: true } | { ok: false; reason: Reason };

/** A refused command, sent only to the socket that sent it. */
export type Rejection =
  | { command: "join"; reason: JoinRejectionReason }
  | { command: "vote"; reason: VoteRejectionReason }
  | { command: "reveal"; reason: RevealRejectionReason }
  | { command: "newRound"; reason: NewRoundRejectionReason }
  | { command: "setDeck"; reason: SetDeckRejectionReason }
  | { command: "setAutoReveal"; reason: SetAutoRevealRejectionReason }
  | { command: "becomeVoter"; reason: RoleRejectionReason }
  | { command: "becomeObserver"; reason: RoleRejectionReason }
  | { command: "handOver"; reason: HandOverRejectionReason }
  | { command: "claimFacilitator"; reason: ClaimFacilitatorRejectionReason }
  | { command: "react"; reason: ReactRejectionReason }
  | { command: "throwAt"; reason: ThrowRejectionReason }
  | { command: "nudge"; reason: NudgeRejectionReason }
  | { command: "summonGhost"; reason: SummonGhostRejectionReason }
  | { command: "dressGhost"; reason: DressGhostRejectionReason }
  | { command: "dismissGhost"; reason: DismissGhostRejectionReason }
  | { command: "moveGhost"; reason: MoveGhostRejectionReason };

export interface ClientToServerEvents {
  /**
   * The role is the one a Participant new to the Room arrives with: "observer" or "voter". It's
   * untrusted input, checked by the Room, and missing from tabs loaded before it existed.
   */
  join: (id: ParticipantId, name: string, role?: unknown) => void;
  vote: (card: number) => void;
  reveal: () => void;
  newRound: () => void;
  setDeck: (cards: number[]) => void;
  setAutoReveal: (on: boolean) => void;
  becomeVoter: () => void;
  becomeObserver: () => void;
  handOver: (to: ParticipantId) => void;
  claimFacilitator: () => void;
  leave: () => void;
  react: (reaction: string) => void;
  throwAt: (to: ParticipantId, item: string) => void;
  /** Nudges the Holdout `to`. */
  nudge: (to: ParticipantId) => void;
  /**
   * The Skin and the roll that picks the Ghost's vent are untrusted input, checked by the Room. With
   * no roll, or one that isn't, the Room rolls its own.
   */
  summonGhost: (skin: unknown, roll?: unknown) => void;
  /** The Skin is untrusted input, checked by the Room. */
  dressGhost: (skin: unknown) => void;
  dismissGhost: () => void;
  /** The point on the shared Table is untrusted input, checked by the Room. */
  moveGhost: (to: unknown) => void;
}

export interface ServerToClientEvents {
  snapshot: (snapshot: RoomSnapshot) => void;
  rejected: (rejection: Rejection) => void;
  /** This browser's Participant left the Room, from this tab or another one. */
  left: () => void;
  /** A Reaction, Throw or Nudge, sent to everyone. It holds no Votes, so it's broadcast. */
  fun: (event: FunEvent) => void;
  /** The Facilitator (`by`) changed the Deck, It holds no Votes, so it's broadcast. */
  deckChanged: (by: ParticipantId) => void;
  /** The Facilitator (`by`) turned Auto Reveal on or off. It holds no Votes, so it's broadcast. */
  autoRevealChanged: (by: ParticipantId, on: boolean) => void;
  /** A Ghost is heading somewhere new. It holds no Votes, so it's broadcast. */
  ghostMoved: (move: GhostMove) => void;
}
