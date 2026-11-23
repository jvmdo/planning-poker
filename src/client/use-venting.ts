import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ParticipantId, ParticipantView } from "../shared/protocol";
import type { GhostView } from "../shared/ghost";
import type { GhostWalker } from "./lib/ghost-walker";

/** A Participant with a Ghost out. */
export type GhostOut = ParticipantView & { ghost: GhostView };

/** A Ghost coming out of a vent, or going into one. See `[data-venting]` in index.css. */
export type Venting = "out" | "in";

/** How long the animations in index.css take, after which a Ghost is just out, or gone. */
const COMING_OUT_MS = 600;
const GOING_IN_MS = 500;

function reducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Which Ghosts this screen shows coming out of a vent or going into one. A Ghost that appears
 * between two snapshots comes out; one that goes (however it goes) is kept drawn where it stands
 * just long enough to sink in. The Ghosts already out when the screen first shows them, as for a
 * late joiner or a reload, just are. With reduced motion, Ghosts simply appear and go.
 *
 * Uses the walker that draws the Ghosts, before its next update: one that goes mid-walk sinks where
 * it's drawn rather than where it was heading, and one that comes back while still sinking rises at
 * its vent rather than walking there.
 */
export function useVenting(
  out: GhostOut[],
  walker: Pick<GhostWalker, "at" | "forget">,
): { drawn: GhostOut[]; venting: ReadonlyMap<ParticipantId, Venting> } {
  const [coming, setComing] = useState<ReadonlySet<ParticipantId>>(new Set());
  const [going, setGoing] = useState<ReadonlyMap<ParticipantId, GhostOut>>(
    new Map(),
  );
  /** The Ghosts out as last drawn, or null before the first snapshot. */
  const last = useRef<Map<ParticipantId, GhostOut> | null>(null);
  const timers = useRef(new Map<ParticipantId, number>());

  // Before paint, so a Ghost that goes is never missing for a frame before it sinks.
  useLayoutEffect(() => {
    const now = new Map(out.map((p) => [p.id, p] as const));
    const before = last.current;
    last.current = now;
    if (!before || reducedMotion()) return;
    const came = [...now.keys()].filter((id) => !before.has(id));
    const gone = [...before.values()].filter((p) => !now.has(p.id));
    if (came.length === 0 && gone.length === 0) return;
    for (const id of came) walker.forget(id);

    const after = (id: ParticipantId, ms: number, done: () => void) => {
      clearTimeout(timers.current.get(id));
      timers.current.set(
        id,
        window.setTimeout(() => {
          timers.current.delete(id);
          done();
        }, ms),
      );
    };
    // A Ghost that comes back while still sinking comes straight out again.
    setComing((prev) => {
      const next = new Set(prev);
      for (const id of came) next.add(id);
      for (const p of gone) next.delete(p.id);
      return next;
    });
    setGoing((prev) => {
      const next = new Map(prev);
      for (const id of came) next.delete(id);
      for (const p of gone) {
        const to = walker.at(p.id) ?? p.ghost.to;
        next.set(p.id, { ...p, ghost: { ...p.ghost, to } });
      }
      return next;
    });
    for (const id of came) {
      after(id, COMING_OUT_MS, () =>
        setComing((prev) => new Set([...prev].filter((k) => k !== id))),
      );
    }
    for (const { id } of gone) {
      after(id, GOING_IN_MS, () =>
        setGoing((prev) => new Map([...prev].filter(([k]) => k !== id))),
      );
    }
  }, [out, walker]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const venting = new Map<ParticipantId, Venting>();
  for (const id of coming) venting.set(id, "out");
  for (const id of going.keys()) venting.set(id, "in");
  const drawn = [
    ...out,
    ...[...going.values()].filter((p) => !out.some((o) => o.id === p.id)),
  ];
  return { drawn, venting };
}
