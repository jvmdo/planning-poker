import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { ParticipantId, ParticipantView } from "../shared/protocol";
import type { GhostView, TablePoint } from "../shared/ghost";
import { cn } from "@/lib/utils";
import { createGhostWalker } from "./lib/ghost-walker";
import { GhostFigure } from "./ghost-figure";

/** An arrow key walks your Ghost a tenth of the Table that way. */
const HOP = 0.1;
const HOPS: Record<string, [number, number]> = {
  ArrowLeft: [-HOP, 0],
  ArrowRight: [HOP, 0],
  ArrowUp: [0, -HOP],
  ArrowDown: [0, HOP],
};

/** What a click in the room area may land on without walking your Ghost there. */
const NOT_EMPTY_SPACE =
  "[data-seat], [data-ghost], button, a, input, select, textarea, label, [role='dialog']";

/**
 * Every Observer's Ghost, drawn over the room area: above the Table, below the Hand and toasts. It
 * covers the room area but ignores the pointer, except on the Ghosts themselves. `tableBox` lays
 * out an inner box exactly over the Table, which Ghosts are positioned on.
 *
 * Each Ghost walks to where the Room says it's heading, turned the way this screen turns the seats.
 * Your own walks where you click in empty room space, or by arrow keys while it has focus.
 */
export function GhostLayer({
  participants,
  myId,
  turn,
  tableBox,
  roomRef,
  tableRef,
  ghostRef,
  onMove,
}: {
  participants: ParticipantView[];
  myId: ParticipantId;
  /** How far this screen turns the Table, from the seat layout. */
  turn: number;
  /** Classes that put the inner box exactly over the Table, matching the room area's padding. */
  tableBox: string;
  /** The room area, which Ghosts stay inside and clicks in walk your own. */
  roomRef: RefObject<HTMLElement | null>;
  /** The Table, whose box Ghosts are positioned on. */
  tableRef: RefObject<HTMLElement | null>;
  /** Each Ghost's figure as it's drawn, or null once it's gone. */
  ghostRef: (id: ParticipantId, element: HTMLElement | null) => void;
  /** Sends your own Ghost walking to a point on the shared Table, from a click or a key. */
  onMove: (to: TablePoint, event: Event) => void;
}) {
  const [walker] = useState(createGhostWalker);
  const withGhosts = participants.filter(
    (p): p is ParticipantView & { ghost: GhostView } => p.ghost !== null,
  );
  const myGhost = withGhosts.find((p) => p.id === myId)?.ghost ?? null;
  /** The latest `onMove`, so the click listener needn't be added again on every render. */
  const move = useRef(onMove);

  // Before paint, so a new Ghost is never drawn anywhere but its place.
  useLayoutEffect(() => {
    move.current = onMove;
    walker.setFrame(roomRef.current, tableRef.current);
    walker.update(
      new Map(withGhosts.map((p) => [p.id, p.ghost.to] as const)),
      turn,
    );
  });

  useEffect(() => {
    const room = roomRef.current;
    if (!room) return;
    const resized = new ResizeObserver(() => walker.redraw());
    resized.observe(room);
    return () => {
      resized.disconnect();
      walker.stop();
    };
  }, [walker, roomRef]);

  // A click on empty room space walks your Ghost there.
  const hasGhost = myGhost !== null;
  useEffect(() => {
    const room = roomRef.current;
    if (!room || !hasGhost) return;
    function onClick(event: MouseEvent) {
      if ((event.target as Element).closest(NOT_EMPTY_SPACE)) return;
      const to = walker.tableAt(event.clientX, event.clientY);
      if (to) move.current(to, event);
    }
    room.addEventListener("click", onClick);
    return () => room.removeEventListener("click", onClick);
  }, [walker, roomRef, hasGhost]);

  function onKeyDown(event: KeyboardEvent) {
    const hop = HOPS[event.key];
    if (!hop || !myGhost) return;
    event.preventDefault();
    const to = walker.hop(myGhost.to, ...hop);
    if (to) onMove(to, event.nativeEvent);
  }

  if (withGhosts.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", tableBox)}>
      <ul aria-label="Ghosts" className="relative h-full">
        {withGhosts.map((p) => {
          const isMine = p.id === myId;
          return (
            <li
              key={p.id}
              data-ghost
              // Placed, and walked, by the walker.
              ref={(element) => walker.setElement(p.id, element)}
              tabIndex={isMine ? 0 : undefined}
              aria-label={isMine ? "Your Ghost: arrow keys walk it" : undefined}
              onKeyDown={isMine ? onKeyDown : undefined}
              className={cn(
                // Centred on its point by the middle of its body, with its name tag below.
                "pointer-events-auto absolute flex -translate-x-1/2 -translate-y-[23px] flex-col items-center gap-0.5 rounded-lg outline-offset-2",
                // Slightly see-through, so a Result under it stays readable; faded while away.
                p.connected ? "opacity-90" : "opacity-50",
              )}
            >
              <div
                ref={(element) => ghostRef(p.id, element)}
                className="animate-ghost-bob motion-reduce:animate-none"
              >
                <GhostFigure
                  skin={p.ghost.skin}
                  className="h-[46px] w-[42px]"
                />
              </div>
              <span
                aria-hidden={isMine}
                className="bg-card border-ink font-display shadow-hard-sm max-w-28 truncate rounded-full border-2 px-1.5 text-[0.65rem] leading-tight font-semibold"
              >
                {p.name}
                <span className="sr-only">
                  's Ghost{!p.connected && ", away"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
