/**
 * What the Holdout's page does when they're Nudged, on top of its shake: their Hand's Cards hop
 * up one after another, the page punches towards them from their Hand, and comic words pop out
 * over the Table, the last one in its middle. All three grow with the level, on the same scale as
 * the shake. With reduced motion none of them play: the red flash stands in for all of it. Drawn
 * with the Web Animations API; cleans up after itself.
 */
import { reducedMotion } from "./fun-animations";
import { nudgeStrength, shakeOf, shoutOf, type ShoutWord } from "./nudge-burst";

/** Where the Holdout's Nudge plays: the strip holding their Hand, and the Table's area. */
export interface HoldoutPlaces {
  hand: HTMLElement | null;
  table: HTMLElement | null;
}

/** Plays it at `level`. Returns a function that stops it at once. */
export function nudgeHoldout(level: number, places: HoldoutPlaces): () => void {
  if (reducedMotion()) return () => {};
  const stops = [
    hop(level, places.hand),
    punch(level, places.hand),
    shout(level, places.table),
  ];
  return () => stops.forEach((stop) => stop());
}

/** How long one Card's hop takes, and how far behind its left neighbour it starts. */
const HOP_MS = 360;
const HOP_STAGGER_MS = 45;

/** The Hand's Cards hop up one after another, "pick one!": higher and more waves with the level. */
function hop(level: number, hand: HTMLElement | null) {
  if (!hand) return () => {};
  const strength = nudgeStrength(level);
  const lift = 14 + strength * 40;
  // The Holdout's strip holds only their Hand, so its buttons are its Cards.
  const cards = [...hand.querySelectorAll("button")];
  // On `transform`, so it adds to the Cards' own `translate` and `rotate` in the fan.
  const animations = cards.map((card, i) =>
    card.animate(
      [
        { transform: "none" },
        {
          transform: `translateY(${-lift}px) rotate(${i % 2 ? 4 : -4}deg)`,
          offset: 0.4,
        },
        { transform: "none" },
      ],
      {
        duration: HOP_MS,
        delay: i * HOP_STAGGER_MS,
        // Every Card waits for the whole wave before hopping again.
        endDelay: (cards.length - 1 - i) * HOP_STAGGER_MS,
        iterations: 1 + Math.round(strength * 3),
        easing: "cubic-bezier(0.3, 0, 0.4, 1)",
      },
    ),
  );
  return () => animations.forEach((animation) => animation.cancel());
}

/** How long one punch of the page takes. */
const PUNCH_MS = 420;

/**
 * The whole page punches towards you from your Hand and springs back: bigger with the level, and
 * as many punches as fit in the shake, so the page is back to its size before the shake ends and
 * stops clipping it. On `scale`, so it adds to the shake's `translate` on the same element.
 */
function punch(level: number, hand: HTMLElement | null) {
  const root = document.getElementById("root");
  if (!root) return () => {};
  const strength = nudgeStrength(level);
  const big = 1.02 + strength * 0.06;
  if (hand) {
    const box = hand.getBoundingClientRect();
    root.style.transformOrigin = `${box.left + box.width / 2}px ${box.top + box.height / 2}px`;
  }
  const animation = root.animate(
    [
      { scale: "1" },
      { scale: String(big), offset: 0.2 },
      { scale: String(2 - big), offset: 0.45 },
      { scale: String(1 + (big - 1) * 0.3), offset: 0.7 },
      { scale: "1" },
    ],
    {
      duration: PUNCH_MS,
      iterations: Math.max(1, Math.floor(shakeOf(level).ms / PUNCH_MS)),
      easing: "ease-out",
    },
  );
  const stop = () => {
    animation.cancel();
    root.style.transformOrigin = "";
  };
  animation.onfinish = stop;
  return stop;
}

/** How far apart the words of a shout pop out. */
const SHOUT_STEP_MS = 180;
/** How long a word takes to pop in, and to pop away. */
const POP_IN_MS = 300;
const POP_OUT_MS = 180;
/** How long a word that isn't the last stays out between the two. */
const WORD_STAYS_MS = 170;
/** The last word stays until a little after the shake, and never less than this. */
const LAST_WORD_LINGERS_MS = 400;
const LAST_WORD_STAYS_MS = 500;

/**
 * The words of the level's shout pop out one after another over the Table, at random places, and
 * pop away; the last one lands in the Table's middle and stays a little past the shake. The Table's
 * area is measured now, so it follows the sidebar, open or closed.
 */
function shout(level: number, table: HTMLElement | null) {
  const area =
    table?.getBoundingClientRect() ??
    new DOMRect(0, 0, innerWidth, innerHeight);
  const words = shoutOf(level);
  const bubbles = words.map((word, i) => {
    const last = i === words.length - 1;
    // Anywhere over the Table, never right at its edge.
    const x = last ? 0.5 : 0.15 + Math.random() * 0.7;
    const y = last ? 0.5 : 0.15 + Math.random() * 0.7;
    const bubble = shoutBubble(
      word,
      area.left + area.width * x,
      area.top + area.height * y,
    );
    const delay = i * SHOUT_STEP_MS;
    const stays = last
      ? Math.max(
          LAST_WORD_STAYS_MS,
          shakeOf(level).ms + LAST_WORD_LINGERS_MS - delay,
        )
      : WORD_STAYS_MS;
    bubble.animate(popKeyframes(-12 + Math.random() * 24, stays), {
      duration: POP_IN_MS + stays + POP_OUT_MS,
      delay,
      easing: "ease-out",
      fill: "both",
    }).onfinish = () => bubble.remove();
    return bubble;
  });
  return () => bubbles.forEach((bubble) => bubble.remove());
}

/** A comic word in a yellow box centred on (x, y), over everything, ignoring the pointer. */
function shoutBubble(word: ShoutWord, x: number, y: number) {
  const bubble = document.createElement("div");
  bubble.setAttribute("aria-hidden", "true");
  bubble.textContent = word.text;
  bubble.style.cssText =
    `position:fixed;left:${x}px;top:${y}px;translate:-50% -50%;z-index:90;pointer-events:none;` +
    `font-family:var(--font-display);font-weight:700;font-size:${word.rem}rem;line-height:1.1;` +
    "color:var(--ink);background:var(--pop-4);border:4px solid var(--ink);" +
    "box-shadow:8px 8px 0 var(--ink);border-radius:1.2rem;padding:0.1em 0.45em;white-space:nowrap";
  document.body.append(bubble);
  return bubble;
}

/** Pops in past its size at a tilt, wobbles back, stays `stays` ms, then pops away. */
function popKeyframes(tilt: number, stays: number): Keyframe[] {
  const at = (scale: number, turn: number) =>
    `scale(${scale}) rotate(${tilt + turn}deg)`;
  const total = POP_IN_MS + stays + POP_OUT_MS;
  const inEnd = POP_IN_MS / total;
  const outStart = 1 - POP_OUT_MS / total;
  return [
    { transform: at(0, -25), opacity: 0, offset: 0 },
    { transform: at(1.35, 8), opacity: 1, offset: inEnd * 0.25 },
    { transform: at(0.88, -4), offset: inEnd * 0.5 },
    { transform: at(1.06, 2), offset: inEnd * 0.75 },
    { transform: at(1, 0), offset: inEnd },
    { transform: at(1, 0), opacity: 1, offset: outStart },
    {
      transform: at(1.18, -4),
      opacity: 1,
      offset: outStart + (1 - outStart) / 2,
    },
    { transform: at(0, 15), opacity: 0, offset: 1 },
  ];
}
