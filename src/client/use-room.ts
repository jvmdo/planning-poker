import { useEffect, useState } from "react";
import type {
  ParticipantId,
  JoinRejectionReason,
  Rejection,
  RoomSnapshot,
} from "../shared/protocol";
import type { Card } from "../shared/deck";
import { saveIdentity, type Identity } from "./lib/identity";
import { socket } from "./lib/socket";

/** How long a notice about a refused command stays on screen. */
const NOTICE_MS = 4000;

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
 * Connects to the Room and keeps the latest snapshot. Rejoins automatically on every (re)connect
 * once this browser has a name to join with.
 */
export function useRoom(identity: Identity) {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [rejection, setRejection] = useState<JoinRejectionReason | null>(null);
  const [name, setName] = useState(identity.name);
  const [wantsToJoin, setWantsToJoin] = useState(identity.name !== "");
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    function onConnect() {
      setConnected(true);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onSnapshot(next: RoomSnapshot) {
      setSnapshot(next);
      const me = findParticipant(next, identity.id);
      if (me) saveIdentity({ id: identity.id, name: me.name });
    }
    function onRejected(rejection: Rejection) {
      if (rejection.command !== "join") {
        setNotice(RACE_NOTICES[keyOf(rejection)] ?? null);
        return;
      }
      setWantsToJoin(false);
      setSnapshot(null);
      setRejection(rejection.reason);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("snapshot", onSnapshot);
    socket.on("rejected", onRejected);
    socket.connect();
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("snapshot", onSnapshot);
      socket.off("rejected", onRejected);
      socket.disconnect();
    };
  }, [identity.id]);

  useEffect(() => {
    if (notice === null) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (connected && wantsToJoin) socket.emit("join", identity.id, name);
  }, [connected, wantsToJoin, name, identity.id]);

  function join(nameToJoinWith: string) {
    setRejection(null);
    setName(nameToJoinWith);
    setWantsToJoin(true);
  }

  function reveal() {
    socket.emit("reveal");
  }

  function newRound() {
    socket.emit("newRound");
  }

  function becomeVoter() {
    socket.emit("becomeVoter");
  }

  function becomeObserver() {
    socket.emit("becomeObserver");
  }

  function handOver(to: ParticipantId) {
    socket.emit("handOver", to);
  }

  function claimFacilitator() {
    socket.emit("claimFacilitator");
  }

  function vote(card: Card) {
    socket.emit("vote", card);
  }

  const me = snapshot ? findParticipant(snapshot, identity.id) : null;
  const joining = me === null && wantsToJoin;

  return {
    connected,
    snapshot,
    notice,
    me,
    name,
    joining,
    rejection,
    join,
    vote,
    reveal,
    newRound,
    becomeVoter,
    becomeObserver,
    handOver,
    claimFacilitator,
  };
}

function findParticipant(snapshot: RoomSnapshot, id: ParticipantId) {
  return snapshot.participants.find((p) => p.id === id) ?? null;
}
