import type { ParticipantId, ParticipantView } from "./protocol.js";

/**
 * The Holdout: the only Voter who hasn't voted in a Round that hasn't been Revealed, or null. An
 * away Voter still counts, as for Auto Reveal. The Room and the browser both use it, so a Nudge
 * is offered only when the Room would accept it.
 */
export function holdoutOf(
  participants: readonly Pick<ParticipantView, "id" | "role" | "hasVoted">[],
  revealed: boolean,
): ParticipantId | null {
  if (revealed) return null;
  const waiting = participants.filter((p) => p.role === "voter" && !p.hasVoted);
  return waiting.length === 1 && waiting[0] ? waiting[0].id : null;
}
