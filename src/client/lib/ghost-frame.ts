/**
 * Converts between the shared Table, where every Ghost's position lives, and one screen.
 *
 * Both are measured on the Table's box, 0 to 1 on each axis. The shared Table is what an Observer
 * sees: seats in Room order, the first Voter at the bottom. A Voter's screen turns the Table so their
 * own seat is at the bottom (see the seat layout), and turns every Ghost with it, so a Ghost over
 * Bruno's Card is over it on every screen. If that rule ever changes, this is the one place to
 * update.
 */
import { TABLE_REACH, type TablePoint } from "../../shared/ghost";

/** This screen's room area, measured on the Table's box: where its Ghosts may be drawn. */
export interface RoomBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Turns a point round the middle of the Table by `turn` radians. The Table's box maps onto a unit
 * circle, so the oval's seats, at even angles, turn onto each other.
 */
function turned({ x, y }: TablePoint, turn: number): TablePoint {
  const u = 2 * x - 1;
  const v = 2 * y - 1;
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  return {
    x: (u * cos - v * sin + 1) / 2,
    y: (u * sin + v * cos + 1) / 2,
  };
}

/**
 * Where a point on the shared Table is drawn on a screen turned by `turn` (the seat layout's), kept
 * inside that screen's room area.
 */
export function tableToScreen(
  point: TablePoint,
  turn: number,
  bounds: RoomBounds,
): TablePoint {
  const { x, y } = turn === 0 ? point : turned(point, turn);
  return {
    x: clamp(x, bounds.left, bounds.right),
    y: clamp(y, bounds.top, bounds.bottom),
  };
}

/** The point on the shared Table under a point on a screen turned by `turn`, within reach. */
export function screenToTable(point: TablePoint, turn: number): TablePoint {
  const { x, y } = turn === 0 ? point : turned(point, -turn);
  return {
    x: clamp(x, TABLE_REACH.min, TABLE_REACH.max),
    y: clamp(y, TABLE_REACH.min, TABLE_REACH.max),
  };
}
