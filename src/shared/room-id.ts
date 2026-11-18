import type { RoomId } from "./protocol.js";

export const MAX_ROOM_ID_LENGTH = 40;

const ROOM_ID = new RegExp(`^[A-Za-z0-9-]{1,${MAX_ROOM_ID_LENGTH}}$`);

/**
 * Reads a Room ID from untrusted input: 1 to `MAX_ROOM_ID_LENGTH` characters from `a–z`, `0–9` and `-`, with
 * uppercase converted to lowercase. Null when it isn't a Room ID. The client reads the URL with
 * it, and the server checks what the client sends.
 */
export function parseRoomId(value: unknown): RoomId | null {
  if (typeof value !== "string" || !ROOM_ID.test(value)) return null;
  return value.toLowerCase();
}
