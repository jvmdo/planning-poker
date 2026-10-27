export type ParticipantId = string;

export type ParticipantRole = "voter" | "observer";

export interface ParticipantView {
  id: ParticipantId;
  name: string;
  role: ParticipantRole;
  isFacilitator: boolean;
}

/** What one Participant is allowed to see of the Room. Built per recipient, never broadcast. */
export interface RoomSnapshot {
  participants: ParticipantView[];
}

export type RejectionReason = "name-empty" | "name-taken";

export interface Rejection {
  reason: RejectionReason;
}

export type CommandResult = { ok: true } | ({ ok: false } & Rejection);

export interface ClientToServerEvents {
  join: (id: ParticipantId, name: string) => void;
}

export interface ServerToClientEvents {
  snapshot: (snapshot: RoomSnapshot) => void;
  rejected: (rejection: Rejection) => void;
}
