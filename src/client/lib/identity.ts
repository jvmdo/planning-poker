import type {
  ParticipantId,
  ParticipantRole,
  RoomId,
} from "../../shared/protocol";
import { parseRoomId } from "../../shared/room-id";
import { isSkin, type Skin } from "../../shared/ghost";

const STORAGE_KEY = "planning-poker:identity";
/** How many Rooms this browser remembers being an Observer in, the most recently used kept. */
const MAX_OBSERVER_ROOMS = 20;

/**
 * Who this browser is, the same in every Room. Kept in browser storage so a reload rejoins as the
 * same Participant.
 */
export interface Identity {
  id: ParticipantId;
  /** The name last joined with, filled in on the join screen. */
  name: string;
  /** The last Room joined, which `/` goes back to. Null after leaving it, or before joining one. */
  lastRoom: RoomId | null;
  /**
   * The Skin this browser's Ghost comes out in whenever it's an Observer without one, in every
   * Room. Null when no Ghost is wanted: never picked, or put away down the vent since.
   */
  ghost: Skin | null;
  /**
   * The Rooms this browser is an Observer in, the latest first. It comes back to them as an
   * Observer after its grace period runs out or a server restart, and joins any other Room as a Voter.
   */
  observerIn: readonly RoomId[];
}

export function loadIdentity(): Identity {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (isStoredIdentity(stored)) {
      // Stored before Rooms had IDs (with `inRoom`), it names no Room: the join screen shows once.
      const lastRoom = parseRoomId(stored.lastRoom);
      const ghost = isSkin(stored.ghost)
        ? { fabric: stored.ghost.fabric, disguise: stored.ghost.disguise }
        : null;
      const observerIn = Array.isArray(stored.observerIn)
        ? stored.observerIn
            .flatMap((room) => parseRoomId(room) ?? [])
            .slice(0, MAX_OBSERVER_ROOMS)
        : [];
      return { id: stored.id, name: stored.name, lastRoom, ghost, observerIn };
    }
  } catch {
    // Unreadable storage: start over with a fresh identity.
  }
  const identity = {
    id: newParticipantId(),
    name: "",
    lastRoom: null,
    ghost: null,
    observerIn: [],
  };
  saveIdentity(identity);
  return identity;
}

export function saveIdentity(identity: Identity): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Storage blocked: the Participant can still play, they just won't be remembered.
  }
}

/** Changes what's stored, keeping the rest as another tab may have left it. */
export function updateIdentity(change: (stored: Identity) => Identity): void {
  saveIdentity(change(loadIdentity()));
}

/** The role this browser joins `roomId` with when the Room doesn't have it, as after a restart. */
export function roleIn(identity: Identity, roomId: RoomId): ParticipantRole {
  return identity.observerIn.includes(roomId) ? "observer" : "voter";
}

/** The identity, remembering this browser as `role` in `roomId`. */
export function withRoleIn(
  identity: Identity,
  roomId: RoomId,
  role: ParticipantRole,
): Identity {
  const others = identity.observerIn.filter((room) => room !== roomId);
  const observerIn =
    role === "observer"
      ? [roomId, ...others].slice(0, MAX_OBSERVER_ROOMS)
      : others;
  return { ...identity, observerIn };
}

function isStoredIdentity(value: unknown): value is Pick<
  Identity,
  "id" | "name"
> & {
  lastRoom?: unknown;
  ghost?: unknown;
  observerIn?: unknown;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Identity).id === "string" &&
    typeof (value as Identity).name === "string"
  );
}

function newParticipantId(): ParticipantId {
  // randomUUID only exists in secure contexts, so fall back for plain-HTTP LAN access.
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
