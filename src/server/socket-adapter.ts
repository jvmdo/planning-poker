import type { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ParticipantId,
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
        socket.emit("rejected", { reason: result.reason });
        return;
      }
      // The change notification fired before this socket was tied to the Participant.
      socket.data.participantId = id;
      socket.emit("snapshot", room.snapshotFor(id));
    });
  });
}
