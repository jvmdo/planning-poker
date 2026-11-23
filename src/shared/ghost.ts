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
