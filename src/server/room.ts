import type {
  CommandResult,
  JoinRejectionReason,
  NewRoundRejectionReason,
  ParticipantId,
  ParticipantRole,
  RevealRejectionReason,
  RoleRejectionReason,
  RoomSnapshot,
  VoteRejectionReason,
} from "../shared/protocol.js";
import { isCard, type Card } from "../shared/deck.js";

interface Participant {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
}

export interface Room {
  join(id: ParticipantId, name: string): CommandResult<JoinRejectionReason>;
  /** Takes any number, since callers pass untrusted input; only Cards in the Deck are accepted. */
  vote(id: ParticipantId, card: number): CommandResult<VoteRejectionReason>;
  reveal(by: ParticipantId): CommandResult<RevealRejectionReason>;
  newRound(by: ParticipantId): CommandResult<NewRoundRejectionReason>;
  becomeVoter(id: ParticipantId): CommandResult<RoleRejectionReason>;
  /** Before the Reveal this discards their Vote; after it, the revealed Vote stays put. */
  becomeObserver(id: ParticipantId): CommandResult<RoleRejectionReason>;
  snapshotFor(id: ParticipantId): RoomSnapshot;
  /** Calls `listener` after every change to the Room. Returns a function that unsubscribes. */
  subscribe(listener: () => void): () => void;
}

/** Names are compared after trimming and ignoring case. */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** The mean of the Votes cast, rounded to one decimal place. */
function resultOf(votes: Iterable<Card>): number {
  const cast = [...votes];
  const mean = cast.reduce((sum, card) => sum + card, 0) / cast.length;
  return Math.round(mean * 10) / 10;
}

export function createRoom(): Room {
  const participants = new Map<ParticipantId, Participant>();
  let facilitatorId: ParticipantId | null = null;
  const votes = new Map<ParticipantId, Card>();
  let revealed = false;
  const listeners = new Set<() => void>();

  function notifyChanged() {
    for (const listener of listeners) listener();
  }

  function setRole(
    id: ParticipantId,
    role: ParticipantRole,
  ): CommandResult<RoleRejectionReason> {
    const participant = participants.get(id);
    if (!participant) return { ok: false, reason: "not-in-room" };
    if (participant.role === role) return { ok: true };

    participant.role = role;
    // An Observer has no Vote, unless it was already revealed (Votes are locked after the Reveal).
    if (role === "observer" && !revealed) votes.delete(id);
    notifyChanged();
    return { ok: true };
  }

  return {
    join(id, name) {
      const key = nameKey(name);
      if (key === "") return { ok: false, reason: "name-empty" };
      const taken = [...participants.values()].some(
        (p) => p.id !== id && nameKey(p.name) === key,
      );
      if (taken) return { ok: false, reason: "name-taken" };

      if (participants.size === 0) facilitatorId = id;
      const role = participants.get(id)?.role ?? "voter";
      participants.set(id, { id, name: name.trim(), role });
      notifyChanged();
      return { ok: true };
    },

    vote(id, card) {
      const participant = participants.get(id);
      if (!participant) return { ok: false, reason: "not-in-room" };
      if (participant.role === "observer") {
        return { ok: false, reason: "observer-cannot-vote" };
      }
      if (!isCard(card)) return { ok: false, reason: "card-not-in-deck" };
      if (revealed) return { ok: false, reason: "round-revealed" };
      votes.set(id, card);
      notifyChanged();
      return { ok: true };
    },

    reveal(by) {
      if (by !== facilitatorId) return { ok: false, reason: "not-facilitator" };
      if (revealed) return { ok: false, reason: "already-revealed" };
      if (votes.size === 0) return { ok: false, reason: "no-votes" };
      revealed = true;
      notifyChanged();
      return { ok: true };
    },

    newRound(by) {
      if (by !== facilitatorId) return { ok: false, reason: "not-facilitator" };
      votes.clear();
      revealed = false;
      notifyChanged();
      return { ok: true };
    },

    becomeVoter: (id) => setRole(id, "voter"),
    becomeObserver: (id) => setRole(id, "observer"),

    snapshotFor(id) {
      return {
        participants: [...participants.values()].map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          isFacilitator: p.id === facilitatorId,
          hasVoted: votes.has(p.id),
          vote: revealed ? (votes.get(p.id) ?? null) : null,
        })),
        myVote: votes.get(id) ?? null,
        revealed,
        result: revealed ? resultOf(votes.values()) : null,
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
