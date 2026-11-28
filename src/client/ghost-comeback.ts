import type { ParticipantView } from "../shared/protocol";
import type { Skin } from "../shared/ghost";
import type { PendingGhost } from "./pending";

/** Whether to summon the remembered Ghost now, and whether it's been tried while you're an Observer. */
export interface GhostComeback {
  summon: Skin | null;
  tried: boolean;
}

/**
 * Brings back the Ghost this browser remembers, once each time you're an Observer without one:
 * after joining, rejoining, or switching back from Voter. A summon the Room refuses isn't tried
 * again until you stop being an Observer in the Room, or rejoin it. `me` is you in the Room's
 * latest snapshot, `wanted` the remembered Skin, and `pending` any change to your Ghost you've
 * just asked for, which is left to settle.
 */
export function ghostComeback(
  tried: boolean,
  me: ParticipantView | null,
  wanted: Skin | null,
  pending: PendingGhost | null,
): GhostComeback {
  if (me?.role !== "observer") return { summon: null, tried: false };
  if (tried || !wanted || me.ghost || pending) return { summon: null, tried };
  return { summon: wanted, tried: true };
}
