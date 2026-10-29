/** The bright colours Cards and Result bars cycle through, as Tailwind classes. */
const POP_BACKGROUNDS = [
  "bg-pop-1",
  "bg-pop-2",
  "bg-pop-3",
  "bg-pop-4",
  "bg-pop-5",
] as const;

export function popBackground(index: number) {
  return POP_BACKGROUNDS[index % POP_BACKGROUNDS.length];
}

/** How a played Card looks: its own colour and the tilt it settles at. Chosen once, on the click. */
export interface CardFlair {
  hue: number;
  tiltDeg: number;
}

/**
 * A fresh random colour and tilt. Only the hue varies, so every colour is as bright as the palette
 * and the ink text stays readable; it always moves well away from the previous hue.
 */
export function randomFlair(previous: CardFlair | null): CardFlair {
  const hue = previous
    ? (previous.hue + 60 + Math.random() * 240) % 360
    : Math.random() * 360;
  return { hue, tiltDeg: (Math.random() * 2 - 1) * 3 };
}

export function flairBackground(flair: CardFlair) {
  // Yellows turn olive at the lightness that suits every other hue, so they get a lighter tone.
  const lightness = flair.hue > 70 && flair.hue < 135 ? 0.88 : 0.8;
  return `oklch(${lightness} 0.15 ${Math.round(flair.hue)})`;
}

/** A quick random twist and lift that springs back to the Card's resting tilt. */
export function flick(element: HTMLElement) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const twist = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4);
  element.animate(
    [
      { transform: "none" },
      {
        transform: `translateY(-12px) rotate(${twist}deg) scale(1.08)`,
        offset: 0.35,
      },
      {
        transform: `translateY(2px) rotate(${-twist * 0.3}deg) scale(0.98)`,
        offset: 0.7,
      },
      { transform: "none" },
    ],
    { duration: 450, easing: "ease-out" },
  );
}
