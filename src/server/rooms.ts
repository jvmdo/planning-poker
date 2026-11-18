import type {
  JoinRejectionReason,
  ParticipantId,
  RoomId,
} from "../shared/protocol.js";
import { createRoom, type Room } from "./room.js";

export type JoinRoomResult =
  { ok: true; room: Room } | { ok: false; reason: JoinRejectionReason };

/** Owns every Room by its Room ID. Knows nothing of sockets. */
export interface Rooms {
  /**
   * Joins the Participant to the Room with this ID, creating the Room if it doesn't exist yet. A
   * Room exists only once someone has joined it: a refused join leaves no Room behind.
   */
  join(roomId: RoomId, id: ParticipantId, name: string): JoinRoomResult;
  /**
   * Calls `listener` with each Room the registry creates, right after its first join. Returns a
   * function that unsubscribes.
   */
  subscribeToNewRooms(
    listener: (roomId: RoomId, room: Room) => void,
  ): () => void;
}

export function createRooms(): Rooms {
  const rooms = new Map<RoomId, Room>();
  const newRoomListeners = new Set<(roomId: RoomId, room: Room) => void>();

  return {
    join(roomId, id, name) {
      const existing = rooms.get(roomId);
      const room = existing ?? createRoom();
      const result = room.join(id, name);
      if (!result.ok) return result;
      if (!existing) {
        rooms.set(roomId, room);
        for (const listener of newRoomListeners) listener(roomId, room);
      }
      return { ok: true, room };
    },

    subscribeToNewRooms(listener) {
      newRoomListeners.add(listener);
      return () => newRoomListeners.delete(listener);
    },
  };
}
