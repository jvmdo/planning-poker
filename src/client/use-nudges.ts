import { useEffect } from "react";
import type { FunEvent } from "../shared/fun";
import type { ParticipantId, RoomSnapshot } from "../shared/protocol";
import { useFunEvents } from "./use-fun-events";

/** The class on the page's root element that shakes the whole page (see index.css). */
const SHAKING = "nudged";
/** How long the shake lasts, as the animation in index.css. */
const SHAKE_MS = 500;

/**
 * Every Nudge in the Room: a toast for everyone saying who Nudged whom, and, when you're the
 * Holdout, your whole page shakes for a moment. The shake stops at once when your Vote lands or
 * the Round is Revealed. Input keeps working throughout, since only the page's look moves.
 */
export function useNudges(
  snapshot: RoomSnapshot | null,
  myId: ParticipantId,
  showNotice: (text: string) => void,
) {
  const doneWaiting =
    snapshot === null || snapshot.revealed || snapshot.myVote !== null;

  useFunEvents((event) => {
    if (event.kind !== "nudge" || !snapshot) return;
    const nameOf = (id: ParticipantId) =>
      snapshot.participants.find((p) => p.id === id)?.name ?? "Someone";
    showNotice(nudgeNotice(event, myId, nameOf));
    if (event.to === myId && !doneWaiting) shake();
  });

  useEffect(() => {
    if (doneWaiting) stopShaking();
  }, [doneWaiting]);

  // A page left while shaking stops.
  useEffect(() => stopShaking, []);
}

function nudgeNotice(
  event: Extract<FunEvent, { kind: "nudge" }>,
  myId: ParticipantId,
  nameOf: (id: ParticipantId) => string,
): string {
  if (event.to === myId) return `${nameOf(event.from)} sent you a Nudge!`;
  if (event.from === myId) return `You Nudged ${nameOf(event.to)}`;
  return `${nameOf(event.from)} Nudged ${nameOf(event.to)}`;
}

let shakeTimer: ReturnType<typeof setTimeout> | undefined;

/** Shakes the page from the start, even if it was already shaking. */
function shake() {
  const root = document.documentElement;
  root.classList.remove(SHAKING);
  // Reading the layout between the two restarts the animation.
  void root.offsetWidth;
  root.classList.add(SHAKING);
  clearTimeout(shakeTimer);
  shakeTimer = setTimeout(stopShaking, SHAKE_MS);
}

function stopShaking() {
  clearTimeout(shakeTimer);
  document.documentElement.classList.remove(SHAKING);
}
