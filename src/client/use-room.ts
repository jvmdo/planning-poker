import { useEffect, useState } from "react";
import type {
  ParticipantId,
  RejectionReason,
  RoomSnapshot,
} from "../shared/protocol";
import { saveIdentity, type Identity } from "./lib/identity";
import { socket } from "./lib/socket";

/**
 * Connects to the Room and keeps the latest snapshot. Rejoins automatically on every (re)connect
 * once this browser has a name to join with.
 */
export function useRoom(identity: Identity) {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [rejection, setRejection] = useState<RejectionReason | null>(null);
  const [name, setName] = useState(identity.name);
  const [wantsToJoin, setWantsToJoin] = useState(identity.name !== "");

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
    function onRejected({ reason }: { reason: RejectionReason }) {
      setWantsToJoin(false);
      setSnapshot(null);
      setRejection(reason);
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
    if (connected && wantsToJoin) socket.emit("join", identity.id, name);
  }, [connected, wantsToJoin, name, identity.id]);

  function join(nameToJoinWith: string) {
    setRejection(null);
    setName(nameToJoinWith);
    setWantsToJoin(true);
  }

  const me = snapshot ? findParticipant(snapshot, identity.id) : null;
  const joining = me === null && wantsToJoin;

  return { connected, snapshot, me, name, joining, rejection, join };
}

function findParticipant(snapshot: RoomSnapshot, id: ParticipantId) {
  return snapshot.participants.find((p) => p.id === id) ?? null;
}
