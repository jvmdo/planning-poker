import { useEffect, useRef, useState, type RefObject } from "react";
import type { ParticipantId, RoomSnapshot } from "../shared/protocol";
import {
  addNudge,
  burstNotice,
  nudgeBeats,
  SHAKE_CYCLE_MS,
  shakeOf,
  type NudgeBurst,
  type Shake,
} from "./lib/nudge-burst";
import { playNudgeSound, readyNudgeSound } from "./lib/nudge-sound";
import {
  handCardsOf,
  nudgeHoldout,
  type HoldoutPlaces,
} from "./lib/holdout-nudge";
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

/** The class on the page's root element that shakes the whole page (see index.css). */
const SHAKING = "nudged";

/**
 * Every Nudge in the Room: a toast for everyone saying who Nudged whom, and, when you're the
 * Holdout, your whole page shakes, your Hand hops, the page punches towards you and comic words
 * pop out (see holdout-nudge.ts), with an alarm following it beat for beat (see nudge-sound.ts),
 * all harder at higher levels. A Nudge that arrives while one is still playing joins it as one burst: it all restarts at the
 * burst's level, and the toast changes in place and is read out once, when the burst is over. A
 * new Round starts a new burst. It all stops at once when your Vote lands or the Round is
 * Revealed. Input keeps working throughout, since only the page's look moves. Returns the burst
 * for everyone else's screen to play as an earthquake at the Holdout's seat (see RoomTable).
 */
export function useNudges(
  snapshot: RoomSnapshot | null,
  myId: ParticipantId,
  showNotice: (text: string, options: { quiet: true }) => void,
  speakNotice: (text: string) => void,
  /** Where the Holdout's Nudge plays round the shake: your Hand's strip and the Table's area. */
  places: { [Place in keyof HoldoutPlaces]: RefObject<HoldoutPlaces[Place]> },
): PlayingNudge | null {
  const doneWaiting =
    snapshot === null || snapshot.revealed || snapshot.myVote !== null;
  /** The burst playing in this browser, until its shake would end. */
  const burst = useRef<NudgeBurst | null>(null);
  const burstTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** The Round the burst is in. */
  const burstRound = useRef<number | null>(null);
  const [playing, setPlaying] = useState<PlayingNudge | null>(null);
  /** Stops the hop, punch and shout playing on your page, if they are. */
  const stopHoldoutNudge = useRef<(() => void) | null>(null);
  /** Silences the alarm playing on your page, if it is. */
  const stopNudgeSound = useRef<(() => void) | null>(null);

  useFunEvents((event) => {
    if (event.kind !== "nudge" || !snapshot) return;
    const sameRound = burstRound.current === snapshot.round;
    const ongoing = sameRound ? burst.current : null;
    const next = addNudge(ongoing, event);
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
      stopHoldoutNudge.current?.();
      stopHoldoutNudge.current = nudgeHoldout(next.level, {
        hand: places.hand.current,
        table: places.table.current,
      });
      // The alarm follows the animation, so it restarts with it.
      stopNudgeSound.current?.();
      stopNudgeSound.current = playNudgeSound(
        nudgeBeats(next.level, handCardsOf(places.hand.current).length),
      );
    }
  });

  useEffect(readyNudgeSound, []);

  useEffect(() => {
    if (doneWaiting) {
      stopShaking();
      stopHoldoutNudge.current?.();
      stopNudgeSound.current?.();
    }
  }, [doneWaiting]);

  // A page left while a burst plays stops it.
  useEffect(
    () => () => {
      clearTimeout(burstTimer.current);
      stopShaking();
      stopHoldoutNudge.current?.();
      stopNudgeSound.current?.();
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
