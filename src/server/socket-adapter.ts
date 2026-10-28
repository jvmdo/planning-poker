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
 * change. Holds no rules: never broadcast one payload to everyone, because what a Participant may
 * see depends on who they are.
 */
export function attachRoom(io: RoomServer, room: Room): void {
  room.subscribe(() => {
    for (const socket of io.sockets.sockets.values()) {
      const { participantId } = socket.data;
      if (participantId)
        socket.emit("snapshot", room.snapshotFor(participantId));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join", (id, name) => {
      if (typeof id !== "string" || typeof name !== "string") return;

      const result = room.join(id, name);
      if (!result.ok) {
        socket.emit("rejected", { command: "join", reason: result.reason });
        return;
      }
      // The change notification fired before this socket was tied to the Participant.
      socket.data.participantId = id;
      socket.emit("snapshot", room.snapshotFor(id));
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
  });
}
