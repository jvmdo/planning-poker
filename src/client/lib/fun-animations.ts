/**
 * The Reaction and Throw animations, drawn over the whole page so they can cross the table. They
 * use fixed-position elements and the Web Animations API, and clean up after themselves.
 */

function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function centreOf(element: Element) {
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
}

/** An emoji centred on a point, above everything, ignoring the pointer. */
function floating(emoji: string, at: { x: number; y: number }, size: string) {
  const element = document.createElement("span");
  element.textContent = emoji;
  element.setAttribute("aria-hidden", "true");
  element.style.cssText = `position:fixed;left:${at.x}px;top:${at.y}px;translate:-50% -50%;font-size:${size};pointer-events:none;z-index:60`;
  document.body.append(element);
  return element;
}

/** With reduced motion: the emoji shows briefly where it lands, without moving. */
function blink(emoji: string, at: Element) {
  const element = floating(emoji, centreOf(at), "2.2rem");
  element.animate(
    [{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }],
    {
      duration: 1200,
    },
  ).onfinish = () => element.remove();
}

/** A Reaction: a few copies of the emoji float up from the Card and fade. */
export function floatReaction(emoji: string, card: Element) {
  if (reducedMotion()) return blink(emoji, card);
  const at = centreOf(card);
  for (let i = 0; i < 3; i++) {
    const element = floating(emoji, at, "2.2rem");
    const drift = (Math.random() - 0.5) * 140;
    element.animate(
      [
        { transform: "scale(0.5)", opacity: 1 },
        {
          transform: `translate(${drift}px, -${160 + Math.random() * 120}px) scale(1.3) rotate(${drift / 6}deg)`,
          opacity: 0,
        },
      ],
      {
        duration: 1200 + i * 150,
        delay: i * 90,
        easing: "ease-out",
        fill: "backwards",
      },
    ).onfinish = () => element.remove();
  }
}

/** How long a Throw is in the air. */
const FLIGHT_MS = 650;

/**
 * The CSS timing function `cubic-bezier(x1, y1, x2, y2)`: how far along an animation is, eased,
 * at time `t` from 0 to 1.
 */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const at = (a: number, b: number, s: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t: number) => {
    // The curve's x grows with s, so halving finds the s whose x is t.
    let low = 0;
    let high = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (at(x1, x2, mid) < t) low = mid;
      else high = mid;
    }
    return at(y1, y2, (low + high) / 2);
  };
}

const throwEasing = cubicBezier(0.3, 0, 0.6, 1);

/** Where a Throw is, `along` its flight from 0 to 1, `dx` and `dy` short of its target. */
function inFlight(along: number, dx: number, dy: number, lift: number) {
  // Up to the top of the arc halfway, then down onto the target, spinning twice all the way.
  if (along <= 0.5) {
    const k = along / 0.5;
    return {
      x: (dx / 2) * k,
      y: (dy / 2 - lift) * k,
      turn: 360 * k,
      scale: 0.8 + 0.5 * k,
    };
  }
  const k = (along - 0.5) / 0.5;
  return {
    x: dx / 2 + (dx / 2) * k,
    y: dy / 2 - lift + (dy / 2 + lift) * k,
    turn: 360 + 360 * k,
    scale: 1.3 - 0.3 * k,
  };
}

/**
 * A Throw: the item arcs and spins from one point to the target, which wobbles on impact. It's
 * drawn frame by frame, re-reading where the target is on screen each time, so it chases a target
 * that moves, like a walking Ghost, and always hits it. The target wobbles where it is.
 */
export function flyThrow(emoji: string, from: Element, to: HTMLElement) {
  if (reducedMotion()) return blink(emoji, to);
  const a = centreOf(from);
  const start = centreOf(to);
  // The arc's height is set by the distance at the start, so a moving target doesn't make it jump.
  const lift = Math.min(
    160,
    60 + Math.hypot(start.x - a.x, start.y - a.y) * 0.25,
  );
  const element = floating(emoji, a, "2.4rem");
  let b = start;
  const startedAt = performance.now();

  function frame(now: number) {
    const t = Math.min(1, (now - startedAt) / FLIGHT_MS);
    // A target that's gone, like a Ghost put away, is aimed at where it was last seen.
    if (to.isConnected) b = centreOf(to);
    const { x, y, turn, scale } = inFlight(
      throwEasing(t),
      b.x - a.x,
      b.y - a.y,
      lift,
    );
    element.style.transform = `translate(${x}px, ${y}px) rotate(${turn}deg) scale(${scale})`;
    if (t < 1) requestAnimationFrame(frame);
    else land(b.x - a.x, b.y - a.y);
  }

  function land(dx: number, dy: number) {
    element.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy + 30}px) scale(1.6)`,
          opacity: 0,
        },
      ],
      { duration: 500, easing: "ease-in", fill: "forwards" },
    ).onfinish = () => element.remove();
    // On the transform, so it adds to a Ghost's bob and walk, which use other properties.
    to.animate(
      [
        { transform: "none" },
        { transform: "rotate(-14deg) scale(0.9)" },
        { transform: "rotate(10deg)" },
        { transform: "rotate(-5deg)" },
        { transform: "none" },
      ],
      { duration: 500, easing: "ease-out" },
    );
  }

  element.style.transform = "translate(0, 0) rotate(0) scale(0.8)";
  requestAnimationFrame(frame);
}

/** A small shake: what a menu does when the burst is used up. */
export function shake(element: HTMLElement) {
  if (reducedMotion()) return;
  element.animate(
    [
      { translate: "0" },
      { translate: "-4px" },
      { translate: "4px" },
      { translate: "0" },
    ],
    { duration: 200 },
  );
}
