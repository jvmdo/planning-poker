import type { ParticipantId } from "../../shared/protocol";
import type { TablePoint } from "../../shared/ghost";
import { screenToTable, tableToScreen, type RoomBounds } from "./ghost-frame";

/** How fast a Ghost walks, on the shared Table: one Table width in 1.5 s. */
const WALK_SPEED = 1 / 1.5;
/** How long a Ghost takes to get up to speed, and to slow to a stop. */
const EASE_S = 0.3;
const ACCELERATION = WALK_SPEED / EASE_S;
/** Closer than this, a Ghost has arrived. */
const ARRIVED = 0.002;
/** A frame after a long pause (a hidden tab) moves no further than this many seconds' worth. */
const LONGEST_FRAME_S = 0.1;
/**
 * How far in from the room area's edges a Ghost's point is kept, in pixels, so the whole Ghost
 * stays on screen: its body is centred on the point, and its name tag hangs below.
 */
const KEEP_IN = { side: 24, top: 26, bottom: 40 };

interface Walk {
  /** Where the Ghost is drawn from, on the shared Table. */
  at: TablePoint;
  /** Table widths per second, on each axis. */
  velocity: TablePoint;
}

function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * One frame of a walk towards `to`: speeding up gently, on at a steady speed, and slowing gently to
 * a stop. A new destination mid-walk carries on from where the Ghost is, at the speed it had.
 */
function stepWalk(walk: Walk, to: TablePoint, dt: number): Walk {
  const dx = to.x - walk.at.x;
  const dy = to.y - walk.at.y;
  const distance = Math.hypot(dx, dy);
  if (distance < ARRIVED) return { at: to, velocity: { x: 0, y: 0 } };

  // As fast as it may go and still stop at the destination.
  const speed = Math.min(WALK_SPEED, Math.sqrt(2 * ACCELERATION * distance));
  const wantX = (dx / distance) * speed;
  const wantY = (dy / distance) * speed;
  const changeX = wantX - walk.velocity.x;
  const changeY = wantY - walk.velocity.y;
  const change = Math.hypot(changeX, changeY);
  const most = ACCELERATION * dt;
  const scale = change > most ? most / change : 1;
  const velocity = {
    x: walk.velocity.x + changeX * scale,
    y: walk.velocity.y + changeY * scale,
  };
  const at = { x: walk.at.x + velocity.x * dt, y: walk.at.y + velocity.y * dt };
  // Arrived, or would overshoot.
  const ahead = (to.x - at.x) * dx + (to.y - at.y) * dy;
  if (Math.hypot(to.x - at.x, to.y - at.y) < ARRIVED || ahead < 0)
    return { at: to, velocity: { x: 0, y: 0 } };
  return { at, velocity };
}

/**
 * Walks every Ghost on this screen, frame by frame, towards where the Room says it's heading. Walks
 * run on the shared Table, so they take as long on every screen; each frame is then drawn through
 * this screen's turn and kept inside its room area. Draws straight onto the Ghosts' elements, so a
 * walk never re-renders anything.
 */
export function createGhostWalker() {
  const walks = new Map<ParticipantId, Walk>();
  const elements = new Map<ParticipantId, HTMLElement>();
  let targets = new Map<ParticipantId, TablePoint>();
  let turn = 0;
  let room: HTMLElement | null = null;
  let table: HTMLElement | null = null;
  let frame: number | null = null;
  let lastFrameAt = 0;

  /** This screen's room area, on the Table's box, with the Ghosts kept a little in from its edges. */
  function measure(): { bounds: RoomBounds; box: DOMRect } | null {
    if (!room || !table) return null;
    const area = room.getBoundingClientRect();
    const box = table.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return null;
    return {
      box,
      bounds: {
        left: (area.left + KEEP_IN.side - box.left) / box.width,
        right: (area.right - KEEP_IN.side - box.left) / box.width,
        top: (area.top + KEEP_IN.top - box.top) / box.height,
        bottom: (area.bottom - KEEP_IN.bottom - box.top) / box.height,
      },
    };
  }

  /** Moves every walk on by `dt` seconds and draws it. Says whether any is still walking. */
  function draw(dt: number): boolean {
    const jump = reducedMotion();
    let walking = false;
    for (const [id, to] of targets) {
      const walk = walks.get(id);
      const next =
        !walk || jump
          ? { at: to, velocity: { x: 0, y: 0 } }
          : stepWalk(walk, to, dt);
      walks.set(id, next);
      if (next.at !== to) walking = true;
    }
    for (const id of walks.keys()) if (!targets.has(id)) walks.delete(id);

    const measured = measure();
    if (!measured) return walking;
    for (const [id, element] of elements) {
      const walk = walks.get(id);
      if (!walk) continue;
      const { x, y } = tableToScreen(walk.at, turn, measured.bounds);
      element.style.left = `${100 * x}%`;
      element.style.top = `${100 * y}%`;
    }
    return walking;
  }

  function tick(now: number) {
    const dt = Math.min(LONGEST_FRAME_S, (now - lastFrameAt) / 1000);
    lastFrameAt = now;
    frame = draw(dt) ? requestAnimationFrame(tick) : null;
  }

  /** Draws everything where it is now, and walks on from there if anything's walking. */
  function redraw() {
    if (frame !== null) return;
    if (draw(0)) {
      lastFrameAt = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  return {
    /** The room area, and the Table whose box points are measured on. */
    setFrame(
      roomElement: HTMLElement | null,
      tableElement: HTMLElement | null,
    ) {
      room = roomElement;
      table = tableElement;
    },
    /** A Ghost's element, positioned on the Table's box, or null once it's gone. */
    setElement(id: ParticipantId, element: HTMLElement | null) {
      if (element) elements.set(id, element);
      else elements.delete(id);
    },
    /**
     * Where each Ghost is heading on the shared Table, and how this screen is turned. A Ghost not
     * seen before appears at its destination; the rest walk there from where they're drawn.
     */
    update(nextTargets: Map<ParticipantId, TablePoint>, nextTurn: number) {
      const measured = measure();
      for (const [id, to] of nextTargets) {
        const walk = walks.get(id);
        const before = targets.get(id);
        if (!walk || !measured || !before) continue;
        if (before.x === to.x && before.y === to.y) continue;
        // Somewhere new: set off from where it's drawn, which may be held in at this screen's edge.
        const drawn = screenToTable(
          tableToScreen(walk.at, nextTurn, measured.bounds),
          nextTurn,
        );
        const heldIn =
          Math.hypot(drawn.x - walk.at.x, drawn.y - walk.at.y) > ARRIVED;
        if (heldIn) walks.set(id, { at: drawn, velocity: { x: 0, y: 0 } });
      }
      targets = nextTargets;
      turn = nextTurn;
      redraw();
    },
    redraw,
    stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
    },
    /** The point on the shared Table under a point in the window, kept inside the room area. */
    tableAt(clientX: number, clientY: number): TablePoint | null {
      const measured = measure();
      if (!measured) return null;
      const { box, bounds } = measured;
      const onScreen = tableToScreen(
        {
          x: (clientX - box.left) / box.width,
          y: (clientY - box.top) / box.height,
        },
        0,
        bounds,
      );
      return screenToTable(onScreen, turn);
    },
    /**
     * A hop from `from` on the shared Table, by `dx` and `dy` of the Table's box as this screen
     * shows it, kept inside the room area.
     */
    hop(from: TablePoint, dx: number, dy: number): TablePoint | null {
      const measured = measure();
      if (!measured) return null;
      const on = tableToScreen(from, turn, measured.bounds);
      const landed = tableToScreen(
        { x: on.x + dx, y: on.y + dy },
        0,
        measured.bounds,
      );
      return screenToTable(landed, turn);
    },
  };
}

export type GhostWalker = ReturnType<typeof createGhostWalker>;
