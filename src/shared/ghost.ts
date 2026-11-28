import type { BurstRule } from "./fun.js";
import type { ParticipantId } from "./protocol.js";

/** Every fabric a Ghost's dress can be made of, by its key, with its name. */
export const FABRICS = {
  "coral-stripes": { name: "Coral stripes" },
  "berry-gingham": { name: "Berry gingham" },
  "sunny-suits": { name: "Sunny suits" },
  "mint-dots": { name: "Mint dots" },
  "lilac-zigzag": { name: "Lilac zigzag" },
  "night-stars": { name: "Night stars" },
} as const;

export type Fabric = keyof typeof FABRICS;

export function isFabric(value: unknown): value is Fabric {
  return typeof value === "string" && Object.hasOwn(FABRICS, value);
}

/** Every disguise a Ghost can wear, by its key, with its name. */
export const DISGUISES = {
  none: { name: "None" },
  ninja: { name: "Ninja" },
  thief: { name: "Thief" },
  astronaut: { name: "Astronaut" },
  rogue: { name: "Rogue" },
} as const;

export type Disguise = keyof typeof DISGUISES;

export function isDisguise(value: unknown): value is Disguise {
  return typeof value === "string" && Object.hasOwn(DISGUISES, value);
}

/** How a Ghost looks: a dress fabric and a disguise. */
export interface Skin {
  fabric: Fabric;
  disguise: Disguise;
}

export function isSkin(value: unknown): value is Skin {
  if (typeof value !== "object" || value === null) return false;
  const { fabric, disguise } = value as Record<string, unknown>;
  return isFabric(fabric) && isDisguise(disguise);
}

/** Any Skin, each equally likely: what the picker offers the first time. */
export function randomSkin(): Skin {
  const pick = <T>(options: readonly T[]) =>
    options[Math.floor(Math.random() * options.length)] as T;
  return {
    fabric: pick(Object.keys(FABRICS) as Fabric[]),
    disguise: pick(Object.keys(DISGUISES) as Disguise[]),
  };
}

/**
 * A point on the shared Table: relative to the Table's box, 0 to 1 on each axis, with the seats in
 * Room order and the first Voter at the bottom. Exactly what an Observer's screen shows.
 */
export interface TablePoint {
  x: number;
  y: number;
}

/** An Observer's Ghost, as everyone sees it. */
export interface GhostView {
  skin: Skin;
  /** Where the Ghost is heading for on the shared Table. */
  to: TablePoint;
}

/**
 * How far round the Table a Ghost may go on each axis of the shared Table. It covers the room area
 * around the Table, and the strip under it where the Hand is, on any screen: on a short screen that
 * strip reaches about three quarters of the Table's height below it.
 */
export const TABLE_REACH = { min: -1, max: 2 } as const;

/** Whether a number on either axis of the shared Table is within a Ghost's reach. */
function inReach(n: number): boolean {
  return n >= TABLE_REACH.min && n <= TABLE_REACH.max;
}

/** Takes any value, since callers pass untrusted input: two finite numbers within reach. */
export function isTablePoint(value: unknown): value is TablePoint {
  if (typeof value !== "object" || value === null) return false;
  const { x, y } = value as Record<string, unknown>;
  const ok = (n: unknown) =>
    typeof n === "number" && Number.isFinite(n) && inReach(n);
  return ok(x) && ok(y);
}

/**
 * How many vents there are round the Table: enough that a new Ghost rarely comes out where the last
 * one did. On a phone, Ghosts on neighbouring vents at the top and bottom of the Table touch tags.
 */
const VENT_COUNT = 12;
/**
 * How far out from the middle of the Table the vents sit, as a share of the way to the seats: in a
 * ring between the Result and the Cards, so they're inside the Table on every screen.
 */
const VENT_RING = 0.62;

/**
 * The vents Ghosts come out of: fixed spots in a ring round the middle of the shared Table, half a
 * step off the bottom so they sit between seats rather than under them. Each screen turns them with
 * the seats, like Ghosts.
 */
export const VENTS: readonly TablePoint[] = Array.from(
  { length: VENT_COUNT },
  (_, i) => {
    const angle = Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / VENT_COUNT;
    return {
      x: 0.5 + (VENT_RING / 2) * Math.cos(angle),
      y: 0.5 + (VENT_RING / 2) * Math.sin(angle),
    };
  },
);

/** How far apart, sideways on the shared Table, Ghosts are shifted: enough for their name tags. */
const GHOST_SHIFT = 0.1;
/** How far apart, up and down, Ghosts are shifted: enough for a Ghost and its name tag. */
const GHOST_SHIFT_DOWN = 0.15;

/**
 * A summon's roll of the dice, 0 up to 1, which picks the order its Ghost tries the vents in. The
 * owner's browser rolls it and sends it with the summon, so it can show the Ghost at the same vent
 * the Room will put it.
 */
export function rollVent(): number {
  return Math.random();
}

/** Takes any value, since callers pass untrusted input: a roll of the dice, 0 up to 1. */
export function isVentRoll(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value < 1
  );
}

/**
 * The places round a vent a Ghost is shifted aside to when every vent is taken, nearest first and
 * sideways before up or down, as far as the Ghost may go.
 */
function* shiftsAround(vent: TablePoint): Generator<TablePoint> {
  for (let ring = 1; ; ring++) {
    const places: [number, number][] = [];
    for (let dy = -ring; dy <= ring; dy++) {
      for (let dx = -ring; dx <= ring; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === ring)
          places.push([dx, dy]);
      }
    }
    places.sort(
      ([ax, ay], [bx, by]) =>
        Math.abs(ay) - Math.abs(by) ||
        Math.abs(ax) - Math.abs(bx) ||
        bx - ax ||
        by - ay,
    );
    let anyInReach = false;
    for (const [dx, dy] of places) {
      const place = {
        x: vent.x + dx * GHOST_SHIFT,
        y: vent.y + dy * GHOST_SHIFT_DOWN,
      };
      if (!inReach(place.x) || !inReach(place.y)) continue;
      anyInReach = true;
      yield place;
    }
    if (!anyInReach) return;
  }
}

/**
 * Where a new Ghost comes out: the vent its summon's roll picks among those no Ghost out is
 * standing on. When every vent is taken it comes out of the vent the roll picks among them all,
 * shifted aside to the nearest free place. The Room decides; the owner's browser uses the same
 * rule, and the same roll, to show their new Ghost before the Room answers.
 */
export function ventFor(roll: number, taken: TablePoint[]): TablePoint {
  const isFree = (place: TablePoint) =>
    taken.every(
      (point) =>
        Math.hypot(point.x - place.x, point.y - place.y) >= GHOST_SHIFT / 2,
    );
  const pick = (vents: readonly TablePoint[]) =>
    vents[Math.floor(roll * vents.length)] as TablePoint;
  const free = VENTS.filter(isFree);
  if (free.length > 0) return pick(free);
  const vent = pick(VENTS);
  for (const place of shiftsAround(vent)) if (isFree(place)) return place;
  // Only if the whole room area is full of Ghosts, far more than a Room holds.
  return vent;
}

/** Ghost moves have a budget of their own: 10 in a row (a held arrow key), then one every 100 ms. */
export const GHOST_MOVE_BURST: BurstRule = { size: 10, refillMs: 100 };

/** An accepted move: the Ghost of `id` is now heading for `to`. Sent to everyone in the Room. */
export interface GhostMove {
  id: ParticipantId;
  to: TablePoint;
}
