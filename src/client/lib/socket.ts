import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/protocol";
import { pageRoom } from "./page-room";

/** Connects to this page's Room, named once in the handshake. At `/` it names none. */
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
  query: pageRoom.valid && pageRoom.roomId ? { room: pageRoom.roomId } : {},
});
