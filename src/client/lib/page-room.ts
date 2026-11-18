import type { RoomId } from "../../shared/protocol";
import { parseRoomId } from "../../shared/room-id";
import { loadIdentity } from "./identity";

/** The Room this page starts in, read from the URL's path and the last Room joined. */
export type PageRoom =
  | {
      valid: true;
      /** Null at `/` for a browser with no last Room: the page offers to create one. */
      roomId: RoomId | null;
      /** It's the last Room joined, so the page rejoins it without the join screen. */
      rejoin: boolean;
    }
  /** The path isn't a Room ID. */
  | { valid: false };

function readPageRoom(): PageRoom {
  const path = location.pathname.slice(1);
  const { lastRoom } = loadIdentity();
  // A URL that names a Room always wins over the last Room.
  const roomId = path === "" ? lastRoom : parseRoomId(path);
  if (path !== "" && roomId === null) return { valid: false };
  // `/` goes to the last Room, and `/Team-Alpha` is the Room team-alpha: show it as it should be.
  if (roomId !== null && roomId !== path) showInAddressBar(roomId);
  return {
    valid: true,
    roomId,
    rejoin: roomId !== null && roomId === lastRoom,
  };
}

/** Puts the Room's URL in the address bar, replacing the history entry. */
export function showInAddressBar(roomId: RoomId): void {
  history.replaceState(
    history.state,
    "",
    `/${roomId}${location.search}${location.hash}`,
  );
}

/** Read once, when the page loads. */
export const pageRoom: PageRoom = readPageRoom();

/** The Room's Share link: its full URL on this site. */
export function shareLinkOf(roomId: RoomId): string {
  return `${location.origin}/${roomId}`;
}

/** The Room ID cut short with "…" after `max` characters, for the status bar and the tab title. */
export function shortRoomId(roomId: RoomId, max: number): string {
  return roomId.length > max ? `${roomId.slice(0, max)}…` : roomId;
}
