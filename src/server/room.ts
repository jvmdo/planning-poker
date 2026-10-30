import type {
  ClaimFacilitatorRejectionReason,
  CommandResult,
  DisconnectRejectionReason,
  HandOverRejectionReason,
  JoinRejectionReason,
  LeaveRejectionReason,
  NewRoundRejectionReason,
  ParticipantId,
  ParticipantRole,
  ReactRejectionReason,
  RevealRejectionReason,
  RoleRejectionReason,
  RoomSnapshot,
  ThrowRejectionReason,
  VoteRejectionReason,
} from "../shared/protocol.js";
import { isCard, type Card } from "../shared/deck.js";
import {
  isReaction,
  isThrowable,
  spendBurst,
  type Burst,
  type FunEvent,
} from "../shared/fun.js";
import { GRACE_PERIOD_MS } from "../shared/protocol.js";

interface Participant {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
  /** Open connections (one per browser tab). Zero means they're away in their grace period. */
  connections: number;
}

export interface Room {
  join(id: ParticipantId, name: string): CommandResult<JoinRejectionReason>;
  /** Takes any number, since callers pass untrusted input; only Cards in the Deck are accepted. */
  vote(id: ParticipantId, card: number): CommandResult<VoteRejectionReason>;
  reveal(by: ParticipantId): CommandResult<RevealRejectionReason>;
  newRound(by: ParticipantId): CommandResult<NewRoundRejectionReason>;
  handOver(
    by: ParticipantId,
    to: ParticipantId,
  ): CommandResult<HandOverRejectionReason>;
  claimFacilitator(
    id: ParticipantId,
  ): CommandResult<ClaimFacilitatorRejectionReason>;
  becomeVoter(id: ParticipantId): CommandResult<RoleRejectionReason>;
  /** Before the Reveal this discards their Vote; after it, the revealed Vote stays put. */
  becomeObserver(id: ParticipantId): CommandResult<RoleRejectionReason>;
  /** One of the Participant's connections closed. */
  disconnect(id: ParticipantId): CommandResult<DisconnectRejectionReason>;
  /**
   * Removes the Participant at once, from every connection. A leaving Facilitator hands the role to
   * another Participant, preferring one who isn't away.
   */
  leave(id: ParticipantId): CommandResult<LeaveRejectionReason>;
  /** Takes any string, since callers pass untrusted input; only listed Reactions are accepted. */
  react(
    id: ParticipantId,
    reaction: string,
  ): CommandResult<ReactRejectionReason>;
  /** Takes any string as the item; only listed Throwables are accepted. */
  throwAt(
    by: ParticipantId,
    to: ParticipantId,
    item: string,
  ): CommandResult<ThrowRejectionReason>;
  snapshotFor(id: ParticipantId): RoomSnapshot;
  /** Calls `listener` after every change to the Room. Returns a function that unsubscribes. */
  subscribe(listener: () => void): () => void;
  /**
   * Calls `listener` with every accepted Reaction and Throw. They change nothing in the Room, so
   * they never notify `subscribe`'s listeners. Returns a function that unsubscribes.
   */
  subscribeToFun(listener: (event: FunEvent) => void): () => void;
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
  let round = 1;
  const graceTimers = new Map<ParticipantId, ReturnType<typeof setTimeout>>();
  const listeners = new Set<() => void>();
  const funListeners = new Set<(event: FunEvent) => void>();
  /** Each Participant's Reactions and Throws left; shared between the two. */
  const bursts = new Map<ParticipantId, Burst>();

  function notifyChanged() {
    for (const listener of listeners) listener();
  }

  function discardRound() {
    votes.clear();
    revealed = false;
    round += 1;
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

  /** Spends one of the Participant's burst, if they have any left, and sends the event out. */
  function sendFun(
    id: ParticipantId,
    event: FunEvent,
  ): CommandResult<"burst-used-up"> {
    const burst = spendBurst(bursts.get(id), Date.now());
    if (!burst) return { ok: false, reason: "burst-used-up" };
    bursts.set(id, burst);
    for (const listener of funListeners) listener(event);
    return { ok: true };
  }

  function remove(id: ParticipantId) {
    clearTimeout(graceTimers.get(id));
    graceTimers.delete(id);
    participants.delete(id);
    bursts.delete(id);
    votes.delete(id);
    if (facilitatorId === id) {
      // The Round can't continue without anyone to run it.
      facilitatorId = null;
      discardRound();
    }
    notifyChanged();
  }

  return {
    join(id, name) {
      const key = nameKey(name);
      if (key === "") return { ok: false, reason: "name-empty" };
      const taken = [...participants.values()].some(
        (p) => p.id !== id && nameKey(p.name) === key,
      );
      if (taken) return { ok: false, reason: "name-taken" };

      clearTimeout(graceTimers.get(id));
      graceTimers.delete(id);
      if (participants.size === 0) facilitatorId = id;
      const existing = participants.get(id);
      participants.set(id, {
        id,
        name: name.trim(),
        role: existing?.role ?? "voter",
        connections: (existing?.connections ?? 0) + 1,
      });
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
      discardRound();
      notifyChanged();
      return { ok: true };
    },

    handOver(by, to) {
      if (by !== facilitatorId) return { ok: false, reason: "not-facilitator" };
      if (to === by) return { ok: false, reason: "already-facilitator" };
      if (!participants.has(to)) {
        return { ok: false, reason: "unknown-participant" };
      }
      facilitatorId = to;
      notifyChanged();
      return { ok: true };
    },

    claimFacilitator(id) {
      if (!participants.has(id)) return { ok: false, reason: "not-in-room" };
      if (facilitatorId !== null) {
        return { ok: false, reason: "facilitator-exists" };
      }
      facilitatorId = id;
      notifyChanged();
      return { ok: true };
    },

    becomeVoter: (id) => setRole(id, "voter"),
    becomeObserver: (id) => setRole(id, "observer"),

    disconnect(id) {
      const participant = participants.get(id);
      if (!participant) return { ok: false, reason: "not-in-room" };
      participant.connections = Math.max(0, participant.connections - 1);
      if (participant.connections > 0 || graceTimers.has(id)) {
        return { ok: true };
      }
      graceTimers.set(
        id,
        setTimeout(() => remove(id), GRACE_PERIOD_MS),
      );
      notifyChanged();
      return { ok: true };
    },

    leave(id) {
      if (!participants.has(id)) return { ok: false, reason: "not-in-room" };
      if (facilitatorId === id) {
        const others = [...participants.values()].filter((p) => p.id !== id);
        const successor =
          others.find((p) => p.connections > 0) ?? others[0] ?? null;
        if (successor) facilitatorId = successor.id;
      }
      remove(id);
      return { ok: true };
    },

    react(id, reaction) {
      const participant = participants.get(id);
      if (!participant) return { ok: false, reason: "not-in-room" };
      if (participant.role === "observer") {
        return { ok: false, reason: "observer-cannot-react" };
      }
      if (!isReaction(reaction)) return { ok: false, reason: "not-a-reaction" };
      return sendFun(id, { kind: "reaction", from: id, reaction });
    },

    throwAt(by, to, item) {
      if (!participants.has(by)) return { ok: false, reason: "not-in-room" };
      const target = participants.get(to);
      if (!target) return { ok: false, reason: "unknown-participant" };
      if (to === by) return { ok: false, reason: "cannot-throw-at-yourself" };
      if (target.role === "observer") {
        return { ok: false, reason: "cannot-throw-at-observer" };
      }
      if (!isThrowable(item)) return { ok: false, reason: "not-throwable" };
      return sendFun(by, { kind: "throw", from: by, to, item });
    },

    snapshotFor(id) {
      return {
        participants: [...participants.values()].map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          isFacilitator: p.id === facilitatorId,
          hasVoted: votes.has(p.id),
          vote: revealed ? (votes.get(p.id) ?? null) : null,
          connected: p.connections > 0,
        })),
        myVote: votes.get(id) ?? null,
        hasFacilitator: facilitatorId !== null,
        round,
        revealed,
        result: revealed ? resultOf(votes.values()) : null,
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    subscribeToFun(listener) {
      funListeners.add(listener);
      return () => funListeners.delete(listener);
    },
  };
}
