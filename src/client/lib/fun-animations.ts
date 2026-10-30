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

/** A Throw: the item arcs and spins from one point to the target Card, which wobbles on impact. */
export function flyThrow(emoji: string, from: Element, to: HTMLElement) {
  if (reducedMotion()) return blink(emoji, to);
  const a = centreOf(from);
  const b = centreOf(to);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lift = Math.min(160, 60 + Math.hypot(dx, dy) * 0.25);
  const element = floating(emoji, a, "2.4rem");
  element.animate(
    [
      { transform: "translate(0, 0) rotate(0) scale(0.8)" },
      {
        transform: `translate(${dx / 2}px, ${dy / 2 - lift}px) rotate(360deg) scale(1.3)`,
      },
      { transform: `translate(${dx}px, ${dy}px) rotate(720deg) scale(1)` },
    ],
    { duration: 650, easing: "cubic-bezier(0.3, 0, 0.6, 1)", fill: "forwards" },
  ).onfinish = () => {
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
  };
}

/** A small shake: what a deck does when the burst is used up. */
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
