import type {
  ClaimFacilitatorRejectionReason,
  CommandResult,
  DismissGhostRejectionReason,
  DressGhostRejectionReason,
  DisconnectRejectionReason,
  HandOverRejectionReason,
  JoinRejectionReason,
  LeaveRejectionReason,
  MoveGhostRejectionReason,
  NewRoundRejectionReason,
  ParticipantId,
  ParticipantRole,
  ReactRejectionReason,
  RevealRejectionReason,
  RoleRejectionReason,
  RoomSnapshot,
  SetAutoRevealRejectionReason,
  SetDeckRejectionReason,
  SummonGhostRejectionReason,
  ThrowRejectionReason,
  VoteRejectionReason,
} from "../shared/protocol.js";
import {
  DEFAULT_DECK,
  inDeck,
  sameDeck,
  toDeck,
  type Card,
  type Deck,
} from "../shared/deck.js";
import {
  isReaction,
  isThrowable,
  spendBurst,
  type Burst,
  type FunEvent,
} from "../shared/fun.js";
import {
  GHOST_MOVE_BURST,
  freeSummonPlace,
  isSkin,
  isTablePoint,
  type GhostMove,
  type GhostView,
} from "../shared/ghost.js";
import { AUTO_REVEAL_DELAY_MS, GRACE_PERIOD_MS } from "../shared/protocol.js";

/**
 * The most Participants a Room takes, counting those in their grace period. Each change sends every
 * Participant their own snapshot, and that CPU is the free instance's real limit (ADR 0002).
 */
const MAX_PARTICIPANTS = 30;

interface Participant {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
  /** Open connections (one per browser tab). Zero means they're away in their grace period. */
  connections: number;
  /** An Observer's Ghost while it's out. */
  ghost: GhostView | null;
}

export interface Room {
  /**
   * Adds the Participant, or reconnects them if they're already in the Room. A new Participant
   * past MAX_PARTICIPANTS is refused with `room-full`; one already in the Room, even in their grace
   * period, can always rejoin.
   */
  join(id: ParticipantId, name: string): CommandResult<JoinRejectionReason>;
  /** Takes any number, since callers pass untrusted input; only Cards in the Deck are accepted. */
  vote(id: ParticipantId, card: number): CommandResult<VoteRejectionReason>;
  reveal(by: ParticipantId): CommandResult<RevealRejectionReason>;
  newRound(by: ParticipantId): CommandResult<NewRoundRejectionReason>;
  /**
   * Takes any values, since callers pass untrusted input. A new Deck discards the Round, as a New
   * Round does; the current Deck is refused, so every Deck sent gets an answer.
   */
  setDeck(
    by: ParticipantId,
    cards: readonly unknown[],
  ): CommandResult<SetDeckRejectionReason>;
  /** Refuses the setting it already has, so every change sent gets an answer. */
  setAutoReveal(
    by: ParticipantId,
    on: boolean,
  ): CommandResult<SetAutoRevealRejectionReason>;
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
  /**
   * Brings out an Observer's Ghost in the middle of the Table. Takes any value as the Skin, since
   * callers pass untrusted input; only listed fabrics and disguises are accepted.
   */
  summonGhost(
    id: ParticipantId,
    skin: unknown,
  ): CommandResult<SummonGhostRejectionReason>;
  /**
   * Changes the Skin of an Observer's Ghost that's out, where it stands. Takes any value as the
   * Skin, since callers pass untrusted input; only listed fabrics and disguises are accepted.
   */
  dressGhost(
    id: ParticipantId,
    skin: unknown,
  ): CommandResult<DressGhostRejectionReason>;
  /** Puts an Observer's Ghost away. */
  dismissGhost(id: ParticipantId): CommandResult<DismissGhostRejectionReason>;
  /**
   * Sends an Observer's Ghost walking to a point on the shared Table. Takes any value as the point,
   * since callers pass untrusted input. Moves are capped by a budget of their own.
   */
  moveGhost(
    id: ParticipantId,
    to: unknown,
  ): CommandResult<MoveGhostRejectionReason>;
  snapshotFor(id: ParticipantId): RoomSnapshot;
  /** No Participants, counting those away in their grace period. */
  isEmpty(): boolean;
  /** Calls `listener` after every change to the Room. Returns a function that unsubscribes. */
  subscribe(listener: () => void): () => void;
  /**
   * Calls `listener` with every accepted Reaction and Throw. They change nothing in the Room, so
   * they never notify `subscribe`'s listeners. Returns a function that unsubscribes.
   */
  subscribeToFun(listener: (event: FunEvent) => void): () => void;
  /**
   * Calls `listener` with the Facilitator's ID each time they change the Deck, after `subscribe`'s
   * listeners. Returns a function that unsubscribes.
   */
  subscribeToDeckChanges(listener: (by: ParticipantId) => void): () => void;
  /**
   * Calls `listener` with the Facilitator's ID and the new setting each time they turn Auto Reveal
   * on or off, after `subscribe`'s listeners. Returns a function that unsubscribes.
   */
  subscribeToAutoRevealChanges(
    listener: (by: ParticipantId, on: boolean) => void,
  ): () => void;

  /**
   * Calls `listener` with every accepted Ghost move. A move doesn't notify `subscribe`'s listeners,
   * but the next snapshot carries the Ghost's latest destination. Returns a function that
   * unsubscribes.
   */
  subscribeToGhosts(listener: (move: GhostMove) => void): () => void;
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
  /**
   * The Votes of Voters whose grace period ran out, set aside until the Round ends, so a phone that
   * slept through it gets its Vote back on rejoining. They count only once their Voter is back.
   */
  const setAside = new Map<ParticipantId, Card>();
  let revealed = false;
  let round = 1;
  /** Kept when everyone leaves: only a new Room (a server start) begins with the default. */
  let deck: Deck = DEFAULT_DECK;
  const graceTimers = new Map<ParticipantId, ReturnType<typeof setTimeout>>();
  /** Kept when everyone leaves, like the Deck. */
  let autoReveal = true;
  /** Running while Auto Reveal counts down to the Reveal. */
  let countdown: ReturnType<typeof setTimeout> | null = null;
  const listeners = new Set<() => void>();
  const funListeners = new Set<(event: FunEvent) => void>();
  /** Each Participant's Reactions and Throws left; shared between the two. */
  const bursts = new Map<ParticipantId, Burst>();
  const deckListeners = new Set<(by: ParticipantId) => void>();
  const autoRevealListeners = new Set<
    (by: ParticipantId, on: boolean) => void
  >();

  /** Every Voter in the Room has voted, counting those away in their grace period. */
  function everyVoterVoted() {
    const voters = [...participants.values()].filter((p) => p.role === "voter");
    return voters.length > 0 && voters.every((p) => votes.has(p.id));
  }

  /**
   * Starts or stops Auto Reveal's countdown to match the Room. Runs on every change. It waits while
   * there's no Facilitator, since nobody could start the next Round.
   */
  function syncCountdown() {
    const due =
      autoReveal && facilitatorId !== null && !revealed && everyVoterVoted();
    if (due && countdown === null) {
      countdown = setTimeout(() => {
        countdown = null;
        revealed = true;
        notifyChanged();
      }, AUTO_REVEAL_DELAY_MS);
    } else if (!due && countdown !== null) {
      clearTimeout(countdown);
      countdown = null;
    }
  }
  const ghostListeners = new Set<(move: GhostMove) => void>();
  /** Each Participant's Ghost moves left, on a budget of their own. */
  const moveBursts = new Map<ParticipantId, Burst>();

  function notifyChanged() {
    syncCountdown();
    for (const listener of listeners) listener();
  }

  function discardRound() {
    votes.clear();
    setAside.clear();
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
    // Only Observers have Ghosts.
    if (role === "voter") participant.ghost = null;
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

  /** `keepVote` sets their Vote aside for the rest of the Round, in case they come back. */
  function remove(id: ParticipantId, { keepVote = false } = {}) {
    clearTimeout(graceTimers.get(id));
    graceTimers.delete(id);
    participants.delete(id);
    bursts.delete(id);
    moveBursts.delete(id);
    const vote = votes.get(id);
    if (keepVote && vote !== undefined) setAside.set(id, vote);
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
      if (!participants.has(id) && participants.size >= MAX_PARTICIPANTS) {
        return { ok: false, reason: "room-full" };
      }
      const taken = [...participants.values()].some(
        (p) => p.id !== id && nameKey(p.name) === key,
      );
      if (taken) return { ok: false, reason: "name-taken" };

      clearTimeout(graceTimers.get(id));
      graceTimers.delete(id);
      if (participants.size === 0) facilitatorId = id;
      const existing = participants.get(id);
      const vote = setAside.get(id);
      if (!existing && vote !== undefined) {
        votes.set(id, vote);
        setAside.delete(id);
      }
      participants.set(id, {
        id,
        name: name.trim(),
        role: existing?.role ?? "voter",
        connections: (existing?.connections ?? 0) + 1,
        ghost: existing?.ghost ?? null,
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
      if (!inDeck(card, deck)) return { ok: false, reason: "card-not-in-deck" };
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

    setDeck(by, cards) {
      if (by !== facilitatorId) return { ok: false, reason: "not-facilitator" };
      const next = toDeck(cards);
      if (!next.ok) return next;
      if (sameDeck(next.deck, deck)) {
        return { ok: false, reason: "deck-unchanged" };
      }
      deck = next.deck;
      // A Vote may be on a Card that's gone, so the Round starts again.
      discardRound();
      notifyChanged();
      for (const listener of deckListeners) listener(by);
      return { ok: true };
    },

    setAutoReveal(by, on) {
      if (by !== facilitatorId) return { ok: false, reason: "not-facilitator" };
      if (on === autoReveal) {
        return { ok: false, reason: "auto-reveal-unchanged" };
      }
      autoReveal = on;
      notifyChanged();
      for (const listener of autoRevealListeners) listener(by, on);
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
        setTimeout(() => remove(id, { keepVote: true }), GRACE_PERIOD_MS),
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
      // An Observer reacts from their Ghost, so needs one out.
      if (participant.role === "observer" && !participant.ghost) {
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
      // An Observer is thrown at through their Ghost, so needs one out.
      if (target.role === "observer" && !target.ghost) {
        return { ok: false, reason: "cannot-throw-at-observer" };
      }
      if (!isThrowable(item)) return { ok: false, reason: "not-throwable" };
      return sendFun(by, { kind: "throw", from: by, to, item });
    },

    summonGhost(id, skin) {
      const participant = participants.get(id);
      if (!participant) return { ok: false, reason: "not-in-room" };
      if (participant.role === "voter") {
        return { ok: false, reason: "voter-cannot-have-ghost" };
      }
      if (!isSkin(skin)) return { ok: false, reason: "not-a-skin" };
      if (participant.ghost) return { ok: false, reason: "ghost-already-out" };
      participant.ghost = {
        skin: { fabric: skin.fabric, disguise: skin.disguise },
        to: freeSummonPlace(
          [...participants.values()].flatMap((p) =>
            p.ghost ? [p.ghost.to] : [],
          ),
        ),
      };
      notifyChanged();
      return { ok: true };
    },

    dressGhost(id, skin) {
      const participant = participants.get(id);
      if (!participant) return { ok: false, reason: "not-in-room" };
      if (!participant.ghost) return { ok: false, reason: "no-ghost" };
      if (!isSkin(skin)) return { ok: false, reason: "not-a-skin" };
      // A new Ghost, not a changed one, so snapshots already sent keep what they showed.
      participant.ghost = {
        ...participant.ghost,
        skin: { fabric: skin.fabric, disguise: skin.disguise },
      };
      notifyChanged();
      return { ok: true };
    },

    dismissGhost(id) {
      const participant = participants.get(id);
      if (!participant) return { ok: false, reason: "not-in-room" };
      if (!participant.ghost) return { ok: false, reason: "no-ghost" };
      participant.ghost = null;
      notifyChanged();
      return { ok: true };
    },

    moveGhost(id, to) {
      const participant = participants.get(id);
      if (!participant) return { ok: false, reason: "not-in-room" };
      if (!participant.ghost) return { ok: false, reason: "no-ghost" };
      if (!isTablePoint(to)) return { ok: false, reason: "not-a-point" };
      const burst = spendBurst(
        moveBursts.get(id),
        Date.now(),
        GHOST_MOVE_BURST,
      );
      if (!burst) return { ok: false, reason: "moves-used-up" };
      moveBursts.set(id, burst);
      const point = { x: to.x, y: to.y };
      // A new Ghost, not a changed one, so snapshots already sent keep what they showed.
      participant.ghost = { ...participant.ghost, to: point };
      for (const listener of ghostListeners) listener({ id, to: point });
      return { ok: true };
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
          ghost: p.ghost,
        })),
        myVote: votes.get(id) ?? null,
        hasFacilitator: facilitatorId !== null,
        round,
        revealed,
        result: revealed ? resultOf(votes.values()) : null,
        deck,
        autoReveal,
        countingDown: countdown !== null,
      };
    },

    isEmpty() {
      return participants.size === 0;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    subscribeToFun(listener) {
      funListeners.add(listener);
      return () => funListeners.delete(listener);
    },

    subscribeToDeckChanges(listener) {
      deckListeners.add(listener);
      return () => deckListeners.delete(listener);
    },

    subscribeToAutoRevealChanges(listener) {
      autoRevealListeners.add(listener);
      return () => autoRevealListeners.delete(listener);
    },
    subscribeToGhosts(listener) {
      ghostListeners.add(listener);
      return () => ghostListeners.delete(listener);
    },
  };
}
