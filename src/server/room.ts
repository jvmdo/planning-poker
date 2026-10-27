import type {
  CommandResult,
  ParticipantId,
  ParticipantRole,
  RoomSnapshot,
} from "../shared/protocol.js";

interface Participant {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
}

export interface Room {
  join(id: ParticipantId, name: string): CommandResult;
  snapshotFor(id: ParticipantId): RoomSnapshot;
  /** Calls `listener` after every change to the Room. Returns a function that unsubscribes. */
  subscribe(listener: () => void): () => void;
}

/** Names are compared after trimming and ignoring case. */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function createRoom(): Room {
  const participants = new Map<ParticipantId, Participant>();
  let facilitatorId: ParticipantId | null = null;
  const listeners = new Set<() => void>();

  function notifyChanged() {
    for (const listener of listeners) listener();
  }

  return {
    join(id, name) {
      const key = nameKey(name);
      if (key === "") return { ok: false, reason: "name-empty" };
      const taken = [...participants.values()].some(
        (p) => p.id !== id && nameKey(p.name) === key,
      );
      if (taken) return { ok: false, reason: "name-taken" };

      if (participants.size === 0) facilitatorId = id;
      participants.set(id, { id, name: name.trim(), role: "voter" });
      notifyChanged();
      return { ok: true };
    },

    snapshotFor() {
      return {
        participants: [...participants.values()].map((p) => ({
          id: p.id,
          name: p.name,
          role: p.role,
          isFacilitator: p.id === facilitatorId,
        })),
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
