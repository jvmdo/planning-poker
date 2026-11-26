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
import { buzz, readyBuzz } from "./lib/buzz";
import { reducedMotion } from "./lib/fun-animations";
import { useFunEvents } from "./use-fun-events";

/**
 * The burst playing in this browser, until its shake would end, for the earthquake at the
 * Holdout's seat on everyone else's screen: `id` changes each time the burst grows, which restarts
 * it at the burst's level.
 */
export interface PlayingNudge {
  to: ParticipantId;
  level: number;
  id: number;
}

/**
 * How long the buzz waits after a burst's first Nudge, so Nudges sent at the same moment are heard
 * as one buzz at the burst's level.
 */
const BUZZ_WAIT_MS = 200;

/** The class on the page's root element that shakes the whole page (see index.css). */
const SHAKING = "nudged";

/**
 * Every Nudge in the Room: a toast for everyone saying who Nudged whom, and, when you're the
 * Holdout, your whole page shakes, harder at higher levels, and a buzz plays once per burst. A
 * Nudge that arrives while one is still playing joins it as one burst: the shake restarts at the
 * burst's level, and the toast changes in place and is read out once, when the burst is over. A
 * new Round starts a new burst. The shake stops at once when your Vote lands or the Round is
 * Revealed. Input keeps working throughout, since only the page's look moves. Returns the burst
 * for everyone else's screen to play as an earthquake at the Holdout's seat (see RoomTable).
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
  /** The burst has buzzed, or is about to: it buzzes only once. */
  const buzzed = useRef(false);
  const buzzTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** The Round the burst is in. */
  const burstRound = useRef<number | null>(null);
  const [playing, setPlaying] = useState<PlayingNudge | null>(null);

  useFunEvents((event) => {
    if (event.kind !== "nudge" || !snapshot) return;
    const sameRound = burstRound.current === snapshot.round;
    const ongoing = sameRound ? burst.current : null;
    const next = addNudge(ongoing, event);
    if (!ongoing || ongoing.to !== next.to) buzzed.current = false;
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
    if (event.to === myId && !doneWaiting) {
      startShaking(shake);
      // Once per burst, at the level it has reached by then.
      if (!buzzed.current) {
        buzzed.current = true;
        buzzTimer.current = setTimeout(
          () => buzz(burst.current?.level ?? next.level),
          BUZZ_WAIT_MS,
        );
      }
    }
  });

  useEffect(readyBuzz, []);

  useEffect(() => {
    if (doneWaiting) {
      stopShaking();
      clearTimeout(buzzTimer.current);
    }
  }, [doneWaiting]);

  // A page left while a burst plays stops it.
  useEffect(
    () => () => {
      clearTimeout(burstTimer.current);
      clearTimeout(buzzTimer.current);
      stopShaking();
    },
    [],
  );

  return playing;
}

let shakeTimer: ReturnType<typeof setTimeout> | undefined;
/** A phone is vibrating for the Nudge, so stopping the shake stops it too. */
let vibrating = false;
/** With reduced motion, a phone vibrates this many times over the length of the shake. */
const VIBRATIONS = 3;

/**
 * Shakes the page from the start, even if it was already shaking. With reduced motion its edge
 * flashes red instead (see index.css), and a phone vibrates.
 */
function startShaking({ ms, px }: Shake) {
  const root = document.documentElement;
  root.classList.remove(SHAKING);
  root.style.setProperty("--nudge-ms", `${ms}ms`);
  root.style.setProperty("--nudge-px", `${px}px`);
  root.style.setProperty("--nudge-cycle", `${SHAKE_CYCLE_MS}ms`);
  root.style.setProperty("--nudge-cycles", String(ms / SHAKE_CYCLE_MS));
  // Reading the layout between the two restarts the animation.
  void root.offsetWidth;
  root.classList.add(SHAKING);
  if (reducedMotion()) {
    // Buzz, pause, buzz…: one more buzz than pauses, all the same length.
    const step = Math.round(ms / (VIBRATIONS * 2 - 1));
    vibrating = vibrate(Array(VIBRATIONS * 2 - 1).fill(step));
  }
  clearTimeout(shakeTimer);
  shakeTimer = setTimeout(stopShaking, ms);
}

/** Vibrates a phone, or 0 stops it. False where unsupported, or refused before a tap. */
function vibrate(pattern: number | number[]): boolean {
  try {
    return navigator.vibrate?.(pattern) ?? false;
  } catch {
    return false;
  }
}

function stopShaking() {
  clearTimeout(shakeTimer);
  if (vibrating) vibrate(0);
  vibrating = false;
  document.documentElement.classList.remove(SHAKING);
}
