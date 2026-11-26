/**
 * The earthquake everyone but the Holdout sees when they're Nudged: their seat Card rumbles, and
 * jagged cracks spread across the Table from it and fade. Both grow with the Nudge's level, on the
 * same scale as the Holdout's shake. Drawn with the Web Animations API; cleans up after itself.
 */
import { reducedMotion } from "./fun-animations";
import { nudgeStrength, shakeOf, type Shake } from "./nudge-burst";

const SVG = "http://www.w3.org/2000/svg";
/** How long the cracks take to spread, then to fade once they've stayed a moment. */
const SPREAD_MS = 450;
const FADE_MS = 700;

/**
 * Starts the earthquake at `card`, a seat on `table` (the oval, whose shape clips the cracks).
 * Returns a function that stops it at once, for a burst to restart it at a new level.
 */
export function earthquake(
  card: HTMLElement,
  table: HTMLElement,
  level: number,
): () => void {
  // With reduced motion, nothing moves.
  if (reducedMotion()) return () => {};
  const shake = shakeOf(level);
  const strength = nudgeStrength(level);
  const stopRumble = rumble(card, shake, strength);
  const stopCracks = crack(card, table, shake, strength);
  return () => {
    stopRumble();
    stopCracks();
  };
}

/**
 * The Card shudders fast from side to side, as long as the Holdout's shake and harder with the
 * level: nothing like a Throw's wobble, which tips it over and back. On `translate`, so it adds to
 * the wobble's `transform` if a Throw lands at the same moment.
 */
function rumble(card: HTMLElement, { ms }: Shake, strength: number) {
  const px = 2 + strength * 4;
  const steps = Math.round(ms / 40);
  const keyframes = Array.from({ length: steps + 1 }, (_, i) => {
    if (i === 0 || i === steps) return { translate: "0 0" };
    // Side to side, fading out over the last third, with a little up and down.
    const fade = Math.min(1, ((steps - i) / steps) * 3);
    const side = (i % 2 === 0 ? 1 : -1) * px * fade;
    const lift = (Math.random() - 0.5) * px * 0.4 * fade;
    return { translate: `${side.toFixed(1)}px ${lift.toFixed(1)}px` };
  });
  const animation = card.animate(keyframes, { duration: ms });
  return () => animation.cancel();
}

interface Point {
  x: number;
  y: number;
}

/**
 * A few jagged cracks from the Card into the Table, more and longer with the level: they spread
 * out, stay a moment, and fade. They're drawn under the seats and the Table's middle, inside the
 * oval, so they never reach the Hand or the toast.
 */
function crack(
  card: HTMLElement,
  table: HTMLElement,
  { ms }: Shake,
  strength: number,
) {
  const box = table.getBoundingClientRect();
  const cardBox = card.getBoundingClientRect();
  const from = {
    x: cardBox.left + cardBox.width / 2 - box.left,
    y: cardBox.top + cardBox.height / 2 - box.top,
  };
  const centre = { x: box.width / 2, y: box.height / 2 };
  const inwards = Math.atan2(centre.y - from.y, centre.x - from.x);
  const reach = Math.min(box.width, box.height);
  const count = 3 + Math.round(strength * 3);

  const layer = document.createElement("div");
  layer.setAttribute("aria-hidden", "true");
  layer.style.cssText =
    "position:absolute;inset:0;border-radius:50%;overflow:hidden;pointer-events:none";
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("width", String(box.width));
  svg.setAttribute("height", String(box.height));
  svg.style.cssText = "position:absolute;left:0;top:0;overflow:visible";
  layer.append(svg);

  for (let i = 0; i < count; i++) {
    // Fanned out towards the middle of the Table, never straight back off its edge.
    const angle =
      inwards + ((i + 0.5) / count - 0.5) * 2.2 + (Math.random() - 0.5) * 0.3;
    const length =
      reach * (0.18 + strength * 0.32) * (0.7 + Math.random() * 0.5);
    const points = jagged(from, angle, length);
    addLine(svg, points, 2.5 + strength * 1.5);
    // A short branch off part-way along, on the longer cracks.
    const fork = points[Math.floor(points.length / 2)];
    if (fork && length > reach * 0.25) {
      const side = Math.random() < 0.5 ? -1 : 1;
      addLine(svg, jagged(fork, angle + side * 0.7, length * 0.35), 1.5);
    }
  }
  // Under everything else on the Table.
  table.prepend(layer);

  const animations: Animation[] = [];
  for (const line of svg.querySelectorAll("polyline")) {
    const length = line.getTotalLength();
    line.style.strokeDasharray = String(length);
    animations.push(
      line.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], {
        duration: SPREAD_MS,
        easing: "cubic-bezier(0.2, 0.9, 0.3, 1)",
        fill: "both",
      }),
    );
  }
  const fading = layer.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: FADE_MS,
    delay: Math.max(ms, SPREAD_MS),
    easing: "ease-in",
    fill: "forwards",
  });
  fading.onfinish = () => layer.remove();
  return () => {
    for (const animation of animations) animation.cancel();
    fading.cancel();
    layer.remove();
  };
}

/** A zigzag of short steps from `from`, heading at `angle` for about `length`. */
function jagged(from: Point, angle: number, length: number): Point[] {
  const points = [from];
  let at = from;
  for (let gone = 0; gone < length;) {
    const step = 10 + Math.random() * 14;
    const heading = angle + (Math.random() - 0.5) * 1.1;
    at = {
      x: at.x + Math.cos(heading) * step,
      y: at.y + Math.sin(heading) * step,
    };
    points.push(at);
    gone += step;
  }
  return points;
}

function addLine(svg: SVGSVGElement, points: Point[], width: number) {
  const line = document.createElementNS(SVG, "polyline");
  line.setAttribute(
    "points",
    points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
  );
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "var(--ink)");
  line.setAttribute("stroke-width", width.toFixed(1));
  line.setAttribute("stroke-linejoin", "miter");
  line.setAttribute("stroke-linecap", "round");
  svg.append(line);
}
