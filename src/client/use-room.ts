import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ParticipantId,
  ParticipantRole,
  JoinRejectionReason,
  Rejection,
  RoomId,
  RoomSnapshot,
} from "../shared/protocol";
import type { Card, Deck } from "../shared/deck";
import {
  NUDGE_COOLDOWN_MS,
  spendBurst,
  type Burst,
  type FunEvent,
  type Reaction,
  type Throwable,
} from "../shared/fun";
import {
  GHOST_MOVE_BURST,
  rollVent,
  type GhostMove,
  type Skin,
  type TablePoint,
} from "../shared/ghost";
import {
  loadIdentity,
  roleIn,
  updateIdentity,
  withRoleIn,
  type Identity,
} from "./lib/identity";
import { connectTo, socket } from "./lib/socket";
import { ghostComeback } from "./ghost-comeback";
import {
  findParticipant,
  isPendingCommand,
  settlePendingCommand,
  settlePendingGhost,
  settlePendingRole,
  settlePendingVote,
  withPending,
  type PendingCommand,
  type PendingGhost,
  type PendingVote,
} from "./pending";

/** How long a notice stays on screen, unless it asks for longer. */
const NOTICE_MS = 4000;

/** A notice in the toast, and how long it stays. */
type Notice = { text: string; ms: number };

/**
 * Commands the UI offers can still be refused when the Room changed a moment earlier. These are
 * the races worth explaining; anything else is corrected by the next snapshot.
 */
type RejectionKey = Rejection extends infer R
  ? R extends Rejection
    ? `${R["command"]}:${R["reason"]}`
    : never
  : never;

const RACE_NOTICES: Partial<Record<RejectionKey, string>> = {
  "handOver:unknown-participant": "That Participant has just left the Room.",
  "vote:round-revealed": "The Votes were revealed before your Card arrived.",
  "reveal:no-votes": "There are no Votes to reveal any more.",
  "claimFacilitator:facilitator-exists":
    "Someone else became the Facilitator first.",
};

function keyOf(rejection: Rejection): RejectionKey {
  return `${rejection.command}:${rejection.reason}` as RejectionKey;
}

/**
 * Connects to the Room `roomId` and keeps the latest snapshot. Rejoins automatically on every
 * (re)connect once this tab has joined, or from the start when `rejoin` is set. Doesn't connect
 * while `roomId` is null.
 */
export function useRoom(
  identity: Identity,
  roomId: RoomId | null,
  rejoin: boolean,
) {
  const [connected, setConnected] = useState(false);
  /** The snapshot came after the latest (re)connect, so it isn't stale. */
  const [rejoined, setRejoined] = useState(false);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [rejection, setRejection] = useState<JoinRejectionReason | null>(null);
  const [name, setName] = useState(identity.name);
  const [wantsToJoin, setWantsToJoin] = useState(rejoin);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);
  const [pendingRole, setPendingRole] = useState<ParticipantRole | null>(null);
  const [pendingGhost, setPendingGhost] = useState<PendingGhost | null>(null);
  const [pendingCommand, setPendingCommand] = useState<PendingCommand | null>(
    null,
  );
  /**
   * Where Ghosts have been sent since the latest snapshot, which carries them all from then on.
   * Moves change nothing else in the Room, so they come on their own, without a snapshot.
   */
  const [ghostMoves, setGhostMoves] = useState<
    ReadonlyMap<ParticipantId, TablePoint>
  >(new Map());
  /** Where you sent your own Ghost, shown at once, until the server sends the move back. */
  const [pendingMove, setPendingMove] = useState<TablePoint | null>(null);
  /** This browser's count of the Reactions and Throws left; the server keeps the real one. */
  const burst = useRef<Burst | undefined>(undefined);
  /**
   * Set while you can't Nudge again, as this browser counts it, and bumped each time the wait
   * restarts. It restarts when the Room sends your Nudge back, after the Room started its own
   * wait, so this one never ends first.
   */
  const [nudgeWait, setNudgeWait] = useState<number | null>(null);
  /** This browser's count of Ghost moves left, on a budget of their own. */
  const moveBurst = useRef<Burst | undefined>(undefined);
  /** The remembered Ghost has been summoned since you last became an Observer here, joined or rejoined. */
  const comebackTried = useRef(false);
  /** Joined from the join screen, so the next snapshot with this browser in it makes this the last Room. */
  const joinedFromJoinScreen = useRef(false);

  const showNotice = useCallback((text: string | null, ms = NOTICE_MS) => {
    setNotice(text === null ? null : { text, ms });
  }, []);

  /**
   * Back to the join form, with the name kept to rejoin with. Read from storage, since this also
   * runs as a socket listener that outlives the render it was made in. `/` stops going back to
   * this Room, unless another tab has joined another Room since.
   */
  const resetToJoinScreen = useCallback(() => {
    const saved = loadIdentity().name;
    setName((current) => saved || current);
    joinedFromJoinScreen.current = false;
    setWantsToJoin(false);
    setSnapshot(null);
    setPendingVote(null);
    setPendingRole(null);
    setPendingCommand(null);
    setPendingMove(null);
    updateIdentity((stored) =>
      stored.lastRoom === roomId ? { ...stored, lastRoom: null } : stored,
    );
  }, [roomId]);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
      setRejoined(false);
      // Whatever was in flight may never reach the server. The snapshot after rejoining says.
      setPendingVote(null);
      setPendingRole(null);
      setPendingGhost(null);
      setPendingCommand(null);
      setPendingMove(null);
    }
    function onSnapshot(next: RoomSnapshot) {
      setSnapshot(next);
      setGhostMoves(new Map());
      // A Ghost that's been put away has nowhere to walk to.
      if (!findParticipant(next, identity.id)?.ghost) setPendingMove(null);
      setRejoined(true);
      setPendingVote((pending) => settlePendingVote(pending, next));
      setPendingRole((pending) =>
        settlePendingRole(pending, next, identity.id),
      );
      setPendingGhost((pending) =>
        settlePendingGhost(pending, next, identity.id),
      );
      setPendingCommand((pending) => settlePendingCommand(pending, next));
      const me = findParticipant(next, identity.id);
      // You come back to this Room, after your grace period or a restart, in the role it last showed.
      if (me && roomId !== null && roleIn(loadIdentity(), roomId) !== me.role)
        updateIdentity((stored) => withRoleIn(stored, roomId, me.role));
      if (me && joinedFromJoinScreen.current) {
        joinedFromJoinScreen.current = false;
        updateIdentity((stored) => ({
          ...stored,
          name: me.name,
          lastRoom: roomId,
        }));
      }
    }
    function onDeckChanged(by: ParticipantId) {
      // The Facilitator knows: they changed it.
      if (by !== identity.id) showNotice("The Facilitator changed the Deck.");
    }
    function onAutoRevealChanged(by: ParticipantId, on: boolean) {
      if (by !== identity.id)
        showNotice(`The Facilitator turned Auto Reveal ${on ? "on" : "off"}.`);
    }
    function onGhostMoved({ id, to }: GhostMove) {
      setGhostMoves((moves) => new Map(moves).set(id, to));
      if (id === identity.id)
        setPendingMove((pending) =>
          pending && pending.x === to.x && pending.y === to.y ? null : pending,
        );
    }
    function onFun(event: FunEvent) {
      if (event.kind === "nudge" && event.from === identity.id)
        setNudgeWait((wait) => (wait === null ? null : wait + 1));
    }
    function onRejected(rejection: Rejection) {
      // A refused move is no news to anyone: your Ghost just walks back to where the Room has it.
      if (rejection.command === "moveGhost") {
        setPendingMove(null);
        return;
      }
      // A refused Nudge needs no notice: its button is already greyed out, or gone.
      if (rejection.command === "nudge") return;
      if (rejection.command === "vote") setPendingVote(null);
      if (
        rejection.command === "summonGhost" ||
        rejection.command === "dressGhost" ||
        rejection.command === "dismissGhost"
      )
        setPendingGhost(null);
      if (
        rejection.command === "becomeVoter" ||
        rejection.command === "becomeObserver"
      )
        setPendingRole(null);
      if (isPendingCommand(rejection.command)) setPendingCommand(null);
      if (rejection.command !== "join") {
        showNotice(RACE_NOTICES[keyOf(rejection)] ?? null);
        return;
      }
      joinedFromJoinScreen.current = false;
      setWantsToJoin(false);
      setSnapshot(null);
      setRejection(rejection.reason);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("snapshot", onSnapshot);
    socket.on("rejected", onRejected);
    socket.on("deckChanged", onDeckChanged);
    socket.on("autoRevealChanged", onAutoRevealChanged);
    socket.on("ghostMoved", onGhostMoved);
    socket.on("fun", onFun);
    socket.on("left", resetToJoinScreen);
    if (roomId !== null) connectTo(roomId);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("snapshot", onSnapshot);
      socket.off("rejected", onRejected);
      socket.off("deckChanged", onDeckChanged);
      socket.off("autoRevealChanged", onAutoRevealChanged);
      socket.off("ghostMoved", onGhostMoved);
      socket.off("fun", onFun);
      socket.off("left", resetToJoinScreen);
      socket.disconnect();
    };
  }, [identity.id, roomId, resetToJoinScreen, showNotice]);

  // Whenever you're an Observer without a Ghost, the one this browser remembers comes back, once.
  useEffect(() => {
    // Out of the Room, or not yet back in it, counts as not being there.
    const me =
      snapshot && rejoined ? findParticipant(snapshot, identity.id) : null;
    const { summon, tried } = ghostComeback(
      comebackTried.current,
      me,
      loadIdentity().ghost,
      pendingGhost,
    );
    comebackTried.current = tried;
    if (!summon || !socket.connected) return;
    const roll = rollVent();
    socket.emit("summonGhost", summon, roll);
    setPendingGhost({ skin: summon, roll });
  }, [snapshot, rejoined, pendingGhost, identity.id]);

  useEffect(() => {
    if (nudgeWait === null) return;
    const timer = setTimeout(() => setNudgeWait(null), NUDGE_COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [nudgeWait]);

  useEffect(() => {
    if (notice === null) return;
    const timer = setTimeout(() => setNotice(null), notice.ms);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    // A Room that no longer has you, as after a restart, takes you back in the role remembered for it.
    if (connected && wantsToJoin && roomId !== null)
      socket.emit("join", identity.id, name, roleIn(loadIdentity(), roomId));
  }, [connected, wantsToJoin, name, identity.id, roomId]);

  function join(nameToJoinWith: string) {
    setRejection(null);
    joinedFromJoinScreen.current = true;
    setName(nameToJoinWith);
    setWantsToJoin(true);
  }

  /**
   * Commands sent before the snapshot after rejoining would reach the server before this browser
   * has rejoined, and be ignored without a reply, so they aren't sent and nothing is marked pending.
   */
  function canSend() {
    return socket.connected && rejoined && snapshot !== null;
  }

  /** Marks the command pending in this Round, or says it can't be sent. */
  function startCommand(
    command: Exclude<PendingCommand["command"], "setAutoReveal">,
  ) {
    if (!snapshot || !canSend()) return false;
    setPendingCommand({ command, fromRound: snapshot.round });
    return true;
  }

  function reveal() {
    if (startCommand("reveal")) socket.emit("reveal");
  }

  function newRound() {
    if (startCommand("newRound")) socket.emit("newRound");
  }

  function setDeck(deck: Deck) {
    if (startCommand("setDeck")) socket.emit("setDeck", [...deck]);
  }

  function setAutoReveal(on: boolean) {
    if (!snapshot || !canSend()) return;
    setPendingCommand({
      command: "setAutoReveal",
      fromRound: snapshot.round,
      on,
    });
    socket.emit("setAutoReveal", on);
  }

  function becomeVoter() {
    if (!canSend()) return;
    setPendingRole("voter");
    socket.emit("becomeVoter");
  }

  function becomeObserver() {
    if (!canSend()) return;
    setPendingRole("observer");
    setPendingVote(null);
    socket.emit("becomeObserver");
  }

  function handOver(to: ParticipantId) {
    socket.emit("handOver", to);
  }

  function claimFacilitator() {
    if (startCommand("claimFacilitator")) socket.emit("claimFacilitator");
  }

  /**
   * The server tells every tab of this browser that they left. While disconnected, this tab goes
   * back to the join form on its own and the server removes them when their grace period expires.
   */
  function leave() {
    if (socket.connected) socket.emit("leave");
    resetToJoinScreen();
  }

  function vote(card: Card) {
    if (!snapshot || !canSend()) return;
    setPendingVote({ card, round: snapshot.round });
    socket.emit("vote", card);
  }

  /** False, sending nothing, when the server would refuse it: the burst is used up, or offline. */
  function spend() {
    if (!canSend()) return false;
    const next = spendBurst(burst.current, Date.now());
    if (!next) return false;
    burst.current = next;
    return true;
  }

  function react(reaction: Reaction) {
    if (!spend()) return false;
    socket.emit("react", reaction);
    return true;
  }

  function throwAt(to: ParticipantId, item: Throwable) {
    if (!spend()) return false;
    socket.emit("throwAt", to, item);
    return true;
  }

  /** Nudges the Holdout `to`, unless you Nudged too recently: the server would refuse it. */
  function nudge(to: ParticipantId) {
    if (!canSend() || nudgeWait !== null) return;
    socket.emit("nudge", to);
    setNudgeWait(0);
  }

  /**
   * Brings out your Ghost in `skin`, as an Observer, or re-dresses it if it's out. Either shows at
   * once, before the server answers. This browser remembers it, in every Room, until it's put away.
   */
  function wearSkin(skin: Skin) {
    if (!canSend()) return;
    const roll = rollVent();
    if (me?.ghost) socket.emit("dressGhost", skin);
    else socket.emit("summonGhost", skin, roll);
    setPendingGhost({ skin, roll });
    updateIdentity((stored) => ({ ...stored, ghost: skin }));
  }

  /**
   * Puts your Ghost away down a vent, back to the Watching line, at once. This browser forgets it,
   * so it no longer comes back.
   */
  function dismissGhost() {
    if (!canSend()) return;
    updateIdentity((stored) => ({ ...stored, ghost: null }));
    socket.emit("dismissGhost");
    setPendingGhost("away");
    showNotice("Folded and vented. Nobody suspects a thing.");
  }

  /**
   * Sends your Ghost walking to a point on the shared Table. It sets off at once, before the server
   * answers. Moves past the budget aren't sent: the server would refuse them.
   */
  function moveGhost(to: TablePoint) {
    if (!canSend()) return;
    const next = spendBurst(moveBurst.current, Date.now(), GHOST_MOVE_BURST);
    if (!next) return;
    moveBurst.current = next;
    setPendingMove(to);
    socket.emit("moveGhost", to);
  }

  // Moves first, so a new Ghost of yours comes out at the vent the Room, which has them all, will pick.
  const displayed =
    snapshot &&
    withPending(
      withGhostMoves(
        snapshot,
        pendingMove
          ? new Map(ghostMoves).set(identity.id, pendingMove)
          : ghostMoves,
      ),
      identity.id,
      pendingVote,
      pendingRole,
      pendingGhost,
    );
  const me = displayed ? findParticipant(displayed, identity.id) : null;
  const joining = me === null && wantsToJoin;

  return {
    connected,
    /** Lost the connection after a snapshot, and its snapshot after rejoining hasn't come yet. */
    reconnecting: displayed !== null && !rejoined,
    /** The server's snapshot plus your pending Vote and role: what the screen shows. */
    snapshot: displayed,
    notice: notice?.text ?? null,
    /** Shows a notice of the page's own in the toast, for `ms` milliseconds. */
    showNotice,
    /** Reveal, New Round, a new Deck or Auto Reveal, sent and not yet answered by the server. */
    pendingCommand: pendingCommand?.command ?? null,
    me,
    name,
    joining,
    rejection,
    join,
    vote,
    reveal,
    newRound,
    setDeck,
    setAutoReveal,
    becomeVoter,
    becomeObserver,
    handOver,
    claimFacilitator,
    leave,
    react,
    throwAt,
    nudge,
    /** You Nudged too recently to Nudge again. */
    nudgeCoolingDown: nudgeWait !== null,
    wearSkin,
    dismissGhost,
    moveGhost,
  };
}

/** The snapshot with each Ghost heading where it was last sent. */
function withGhostMoves(
  snapshot: RoomSnapshot,
  moves: ReadonlyMap<ParticipantId, TablePoint>,
): RoomSnapshot {
  if (moves.size === 0) return snapshot;
  return {
    ...snapshot,
    participants: snapshot.participants.map((p) => {
      const to = moves.get(p.id);
      return p.ghost && to ? { ...p, ghost: { ...p.ghost, to } } : p;
    }),
  };
}
