/**
 * What this browser has sent and the server hasn't answered yet.
 *
 * A Vote or a role change affects only the person clicking, so it is shown before the server
 * confirms it. Reveal, New Round, a new Deck and claiming the Facilitator role change everyone's
 * screen, so they are never shown early: they only mark their buttons busy. Each pending thing stays until a snapshot confirms it,
 * the server refuses it, or it stops making sense. A snapshot that merely predates it, such as one
 * caused by someone else's Vote, doesn't drop it, so it never flashes back.
 */
import type {
  ParticipantId,
  ParticipantRole,
  RoomSnapshot,
} from "../shared/protocol";
import type { Card } from "../shared/deck";

export interface PendingVote {
  card: Card;
  /** The Round it was played in. A pending Vote never outlives its Round. */
  round: number;
}

/** Drops the pending Vote once the snapshot holds it, or once its Round is over. */
export function settlePendingVote(
  pending: PendingVote | null,
  snapshot: RoomSnapshot,
): PendingVote | null {
  if (!pending) return null;
  if (snapshot.round !== pending.round || snapshot.revealed) return null;
  if (snapshot.myVote === pending.card) return null;
  return pending;
}

/** Drops the pending role once the snapshot shows it, or once you're no longer in the Room. */
export function settlePendingRole(
  pending: ParticipantRole | null,
  snapshot: RoomSnapshot,
  myId: ParticipantId,
): ParticipantRole | null {
  const me = findParticipant(snapshot, myId);
  if (!me || me.role === pending) return null;
  return pending;
}

/** The commands that change everyone's screen, so they wait on the server. */
export const PENDING_COMMANDS = [
  "reveal",
  "newRound",
  "setDeck",
  "claimFacilitator",
] as const;

export function isPendingCommand(
  command: string,
): command is PendingCommand["command"] {
  return (PENDING_COMMANDS as readonly string[]).includes(command);
}

export interface PendingCommand {
  command: (typeof PENDING_COMMANDS)[number];
  /**
   * The Round it was sent in. Each command is answered once that Round is over: a New Round, and a
   * changed Deck, start the next one.
   */
  fromRound: number;
}

/**
 * Drops the pending command once the snapshot shows its effect. A claim is answered once anyone is
 * the Facilitator: if it wasn't you, the server's refusal says so.
 */
export function settlePendingCommand(
  pending: PendingCommand | null,
  snapshot: RoomSnapshot,
): PendingCommand | null {
  if (!pending || snapshot.round !== pending.fromRound) return null;
  if (pending.command === "reveal" && snapshot.revealed) return null;
  if (pending.command === "claimFacilitator" && snapshot.hasFacilitator)
    return null;
  return pending;
}

/** The snapshot as this browser should display it: the server's, plus your pending Vote and role. */
export function withPending(
  snapshot: RoomSnapshot,
  myId: ParticipantId,
  vote: PendingVote | null,
  role: ParticipantRole | null,
): RoomSnapshot {
  const myRole = role ?? findParticipant(snapshot, myId)?.role;
  // Becoming an Observer before the Reveal gives up your Vote.
  const myVote =
    myRole === "observer" && !snapshot.revealed
      ? null
      : (vote?.card ?? snapshot.myVote);

  return {
    ...snapshot,
    myVote,
    participants: snapshot.participants.map((p) =>
      p.id === myId && myRole
        ? {
            ...p,
            role: myRole,
            hasVoted: snapshot.revealed ? p.hasVoted : myVote !== null,
          }
        : p,
    ),
  };
}

export function findParticipant(snapshot: RoomSnapshot, id: ParticipantId) {
  return snapshot.participants.find((p) => p.id === id) ?? null;
}
