import type { RoomId } from "../../shared/protocol";
import { parseRoomId } from "../../shared/room-id";

/** The Room this page is for, read from the URL's path. */
export type PageRoom =
  /** `roomId` is null at `/`. */
  | { valid: true; roomId: RoomId | null }
  /** The path isn't a Room ID. */
  | { valid: false };

function readPageRoom(): PageRoom {
  const path = location.pathname.slice(1);
  if (path === "") return { valid: true, roomId: null };
  const roomId = parseRoomId(path);
  if (roomId === null) return { valid: false };
  // `/Team-Alpha` is the Room team-alpha: show it as the address bar should.
  if (roomId !== path) {
    history.replaceState(
      history.state,
      "",
      `/${roomId}${location.search}${location.hash}`,
    );
  }
  return { valid: true, roomId };
}

/** Read once, when the page loads: a Room's page stays that Room's. */
export const pageRoom: PageRoom = readPageRoom();
