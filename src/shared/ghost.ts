import type { BurstRule } from "./fun.js";
import type { ParticipantId } from "./protocol.js";

/** Every fabric a Ghost's dress can be made of, by its key, with its name. */
export const FABRICS = {
  "coral-stripes": { name: "Coral stripes" },
} as const;

export type Fabric = keyof typeof FABRICS;

export function isFabric(value: unknown): value is Fabric {
  return typeof value === "string" && Object.hasOwn(FABRICS, value);
}

/** Every disguise a Ghost can wear, by its key, with its name. */
export const DISGUISES = {
  none: { name: "None" },
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

/** The Skin a Ghost wears until its owner can pick one. */
export const DEFAULT_SKIN: Skin = { fabric: "coral-stripes", disguise: "none" };

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
 * around the Table, and under the Hand, on any screen.
 */
export const TABLE_REACH = { min: -0.5, max: 1.5 } as const;

/** Takes any value, since callers pass untrusted input: two finite numbers within reach. */
export function isTablePoint(value: unknown): value is TablePoint {
  if (typeof value !== "object" || value === null) return false;
  const { x, y } = value as Record<string, unknown>;
  const inReach = (n: unknown) =>
    typeof n === "number" &&
    Number.isFinite(n) &&
    n >= TABLE_REACH.min &&
    n <= TABLE_REACH.max;
  return inReach(x) && inReach(y);
}

/** Ghost moves have a budget of their own: 10 in a row (a held arrow key), then one every 100 ms. */
export const GHOST_MOVE_BURST: BurstRule = { size: 10, refillMs: 100 };

/** An accepted move: the Ghost of `id` is now heading for `to`. Sent to everyone in the Room. */
export interface GhostMove {
  id: ParticipantId;
  to: TablePoint;
}
