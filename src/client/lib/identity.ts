import type { ParticipantId } from "../../shared/protocol";

const STORAGE_KEY = "planning-poker:identity";

/** Who this browser is in the Room. Kept in browser storage so a reload rejoins as the same Participant. */
export interface Identity {
  id: ParticipantId;
  name: string;
}

export function loadIdentity(): Identity {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (isIdentity(stored)) return stored;
  } catch {
    // Unreadable storage: start over with a fresh identity.
  }
  const identity = { id: newParticipantId(), name: "" };
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

function isIdentity(value: unknown): value is Identity {
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
