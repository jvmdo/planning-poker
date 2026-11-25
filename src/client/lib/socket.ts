import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  RoomId,
  ServerToClientEvents,
} from "../../shared/protocol";

/** The connection to this page's Room. Connect it with `connectTo`. */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
});

/** Connects to the Room `roomId`, named once in the handshake. */
export function connectTo(roomId: RoomId): void {
  socket.io.opts.query = { room: roomId };
  socket.connect();
}
