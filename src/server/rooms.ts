import type {
  JoinRejectionReason,
  ParticipantId,
  RoomId,
} from "../shared/protocol.js";
import { createRoom, type Room } from "./room.js";

export type JoinRoomResult =
  { ok: true; room: Room } | { ok: false; reason: JoinRejectionReason };

/**
 * Owns every Room by its Room ID. Knows nothing of sockets. A Room is removed a minute after it
 * becomes empty (counting Participants in their grace period); a join during that minute keeps it.
 */
export interface Rooms {
  /**
   * Joins the Participant to the Room with this ID, creating the Room if it doesn't exist yet. A
   * Room exists only once someone has joined it: a refused join leaves no Room behind. Creating a
   * Room past MAX_ROOMS is refused with `server-full`; Rooms that exist keep accepting joins. The
   * role to arrive with is untrusted input, as `Room.join` takes it.
   */
  join(
    roomId: RoomId,
    id: ParticipantId,
    name: string,
    role?: unknown,
  ): JoinRoomResult;
  /**
   * Calls `listener` with each Room the registry creates, right after its first join. Returns a
   * function that unsubscribes.
   */
  subscribeToNewRooms(
    listener: (roomId: RoomId, room: Room) => void,
  ): () => void;
}

/**
 * The most Rooms the server holds, counting empty ones not yet removed. Any URL can create a Room,
 * and the free instance's CPU, spent sending each Participant their own snapshot, is the real
 * limit (ADR 0002).
 */
const MAX_ROOMS = 100;

/** How long an empty Room is kept, so a team that drops off together comes back to its Deck. */
const EMPTY_ROOM_LIFETIME_MS = 60_000;

export function createRooms(): Rooms {
  const rooms = new Map<RoomId, Room>();
  /** The Rooms that are empty, each with the timer that removes it. */
  const removals = new Map<RoomId, ReturnType<typeof setTimeout>>();
  const newRoomListeners = new Set<(roomId: RoomId, room: Room) => void>();

  function scheduleRemoval(roomId: RoomId, room: Room) {
    if (removals.has(roomId)) return;
    removals.set(
      roomId,
      setTimeout(() => {
        removals.delete(roomId);
        if (rooms.get(roomId) === room) rooms.delete(roomId);
      }, EMPTY_ROOM_LIFETIME_MS),
    );
  }

  function cancelRemoval(roomId: RoomId) {
    clearTimeout(removals.get(roomId));
    removals.delete(roomId);
  }

  return {
    join(roomId, id, name, role) {
      const existing = rooms.get(roomId);
      if (!existing && rooms.size >= MAX_ROOMS) {
        return { ok: false, reason: "server-full" };
      }
      const room = existing ?? createRoom();
      const result = room.join(id, name, role);
      if (!result.ok) return result;
      if (!existing) {
        rooms.set(roomId, room);
        // A Room only empties through a change, so each change is when to look.
        room.subscribe(() => {
          if (room.isEmpty()) scheduleRemoval(roomId, room);
          else cancelRemoval(roomId);
        });
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
