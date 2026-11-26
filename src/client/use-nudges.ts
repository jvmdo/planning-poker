import { useEffect, useRef, useState } from "react";
import type { ParticipantId, RoomSnapshot } from "../shared/protocol";
import {
  addNudge,
  burstNotice,
  SHAKE_CYCLE_MS,
  shakeOf,
  type NudgeBurst,
  type Shake,
} from "./lib/nudge-burst";
import { useFunEvents } from "./use-fun-events";

/**
 * The burst playing in this browser, until its shake would end, for the earthquake at the Holdout's seat on everyone else's
 * screen: `id` changes each time the burst grows, which restarts it at the burst's level.
 */
export interface PlayingNudge {
  to: ParticipantId;
  level: number;
  id: number;
}

/** The class on the page's root element that shakes the whole page (see index.css). */
const SHAKING = "nudged";

/**
 * Every Nudge in the Room: a toast for everyone saying who Nudged whom, and, when you're the
 * Holdout, your whole page shakes, harder at higher levels. A Nudge that arrives while one is still
 * playing joins it as one burst: the shake restarts at the burst's level, and the toast changes in
 * place and is read out once, when the burst is over. A new Round starts a new burst. The shake
 * stops at once when your Vote lands or the Round is Revealed. Input keeps working throughout,
 * since only the page's look moves. Returns the burst for everyone else's screen to play as an
 * earthquake at the Holdout's seat (see RoomTable).
 */
export function useNudges(
  snapshot: RoomSnapshot | null,
  myId: ParticipantId,
  showNotice: (text: string, options: { quiet: true }) => void,
  speakNotice: (text: string) => void,
): PlayingNudge | null {
  const doneWaiting =
    snapshot === null || snapshot.revealed || snapshot.myVote !== null;
  /** The burst playing in this browser, until its shake would end. */
  const burst = useRef<NudgeBurst | null>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** The Round the burst is in. */
  const burstRound = useRef<number | null>(null);
  const [playing, setPlaying] = useState<PlayingNudge | null>(null);

  useFunEvents((event) => {
    if (event.kind !== "nudge" || !snapshot) return;
    const sameRound = burstRound.current === snapshot.round;
    const next = addNudge(sameRound ? burst.current : null, event);
    burstRound.current = snapshot.round;
    burst.current = next;
    setPlaying((last) => ({
      to: next.to,
      level: next.level,
      id: (last?.id ?? 0) + 1,
    }));
    const text = burstNotice(
      next,
      myId,
      (id) => snapshot.participants.find((p) => p.id === id)?.name ?? "Someone",
    );
    const shake = shakeOf(next.level);
    showNotice(text, { quiet: true });
    clearTimeout(burstTimer.current);
    burstTimer.current = setTimeout(() => {
      burst.current = null;
      setPlaying(null);
      speakNotice(text);
    }, shake.ms);
    if (event.to === myId && !doneWaiting) startShaking(shake);
  });

  useEffect(() => {
    if (doneWaiting) stopShaking();
  }, [doneWaiting]);

  // A page left while a burst plays stops it.
  useEffect(
    () => () => {
      clearTimeout(burstTimer.current);
      stopShaking();
    },
    [],
  );

  return playing;
}

let shakeTimer: ReturnType<typeof setTimeout> | undefined;

/** Shakes the page from the start, even if it was already shaking. */
function startShaking({ ms, px }: Shake) {
  const root = document.documentElement;
  root.classList.remove(SHAKING);
  root.style.setProperty("--nudge-px", `${px}px`);
  root.style.setProperty("--nudge-cycle", `${SHAKE_CYCLE_MS}ms`);
  root.style.setProperty("--nudge-cycles", String(ms / SHAKE_CYCLE_MS));
  // Reading the layout between the two restarts the animation.
  void root.offsetWidth;
  root.classList.add(SHAKING);
  clearTimeout(shakeTimer);
  shakeTimer = setTimeout(stopShaking, ms);
}

function stopShaking() {
  clearTimeout(shakeTimer);
  document.documentElement.classList.remove(SHAKING);
}
