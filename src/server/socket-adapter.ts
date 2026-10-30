import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  CommandResult,
  ParticipantId,
  Rejection,
  ServerToClientEvents,
} from "../shared/protocol.js";
import type { Room } from "./room.js";

interface SocketData {
  participantId?: ParticipantId;
}

export type RoomServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

/**
 * Translates socket events into Room commands and sends each socket its own snapshot after every
 * change. Holds no rules: never broadcast a snapshot to everyone, because what a Participant may
 * see depends on who they are. Reactions and Throws hold no Votes, so they are broadcast.
 */
export function attachRoom(io: RoomServer, room: Room): void {
  room.subscribe(() => {
    for (const socket of io.sockets.sockets.values()) {
      const { participantId } = socket.data;
      if (participantId)
        socket.emit("snapshot", room.snapshotFor(participantId));
    }
  });

  room.subscribeToFun((event) => {
    for (const socket of io.sockets.sockets.values()) {
      if (socket.data.participantId) socket.emit("fun", event);
    }
  });

  io.on("connection", (socket) => {
    socket.on("join", (id, name) => {
      if (typeof id !== "string" || typeof name !== "string") return;
      // Each socket is one connection, so a repeated join from it mustn't be counted twice.
      if (socket.data.participantId === id) {
        socket.emit("snapshot", room.snapshotFor(id));
        return;
      }

      const result = room.join(id, name);
      if (!result.ok) {
        socket.emit("rejected", { command: "join", reason: result.reason });
        return;
      }
      // This socket no longer speaks for any Participant it joined as before.
      if (socket.data.participantId) room.disconnect(socket.data.participantId);
      // The change notification fired before this socket was tied to the Participant.
      socket.data.participantId = id;
      socket.emit("snapshot", room.snapshotFor(id));
    });

    socket.on("disconnect", () => {
      const { participantId } = socket.data;
      if (participantId) room.disconnect(participantId);
    });

    /** Runs a command as this socket's Participant and tells only this socket if it's refused. */
    function act<Command extends Rejection["command"]>(
      command: Command,
      run: (
        id: ParticipantId,
      ) => CommandResult<Extract<Rejection, { command: Command }>["reason"]>,
    ) {
      const { participantId } = socket.data;
      if (!participantId) return;

      const result = run(participantId);
      if (!result.ok) {
        socket.emit("rejected", {
          command,
          reason: result.reason,
        } as Rejection);
      }
    }

    socket.on("vote", (card) => act("vote", (id) => room.vote(id, card)));
    socket.on("reveal", () => act("reveal", (id) => room.reveal(id)));
    socket.on("newRound", () => act("newRound", (id) => room.newRound(id)));
    socket.on("becomeVoter", () =>
      act("becomeVoter", (id) => room.becomeVoter(id)),
    );
    socket.on("becomeObserver", () =>
      act("becomeObserver", (id) => room.becomeObserver(id)),
    );
    socket.on("handOver", (to) => {
      if (typeof to !== "string") return;
      act("handOver", (id) => room.handOver(id, to));
    });
    socket.on("claimFacilitator", () =>
      act("claimFacilitator", (id) => room.claimFacilitator(id)),
    );
    socket.on("react", (reaction) => {
      if (typeof reaction !== "string") return;
      act("react", (id) => room.react(id, reaction));
    });
    socket.on("throwAt", (to, item) => {
      if (typeof to !== "string" || typeof item !== "string") return;
      act("throwAt", (id) => room.throwAt(id, to, item));
    });
    socket.on("leave", () => {
      const { participantId } = socket.data;
      if (!participantId) return;
      // Every tab of this browser is the same Participant, so they all leave together.
      const tabs = [...io.sockets.sockets.values()].filter(
        (s) => s.data.participantId === participantId,
      );
      for (const tab of tabs) tab.data.participantId = undefined;
      room.leave(participantId);
      for (const tab of tabs) tab.emit("left");
    });
  });
}
