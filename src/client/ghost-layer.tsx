import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ParticipantId, ParticipantView } from "../shared/protocol";
import type { FunEvent } from "../shared/fun";
import type { TablePoint } from "../shared/ghost";
import { cn } from "@/lib/utils";
import { createGhostWalker } from "./lib/ghost-walker";
import { FunMenu, type FunItem } from "./fun-menu";
import { GhostFigure } from "./ghost-figure";
import { useVenting, type GhostOut } from "./use-venting";

/** An arrow key walks your Ghost a tenth of the Table that way. */
const HOP = 0.1;
const HOPS: Record<string, [number, number]> = {
  ArrowLeft: [-HOP, 0],
  ArrowRight: [HOP, 0],
  ArrowUp: [0, -HOP],
  ArrowDown: [0, HOP],
};

/**
 * Where focus may be without the arrow keys walking your Ghost: anywhere you type, or anything that
 * uses the arrow keys itself, or an open dialog.
 */
const KEEPS_ARROWS =
  "input, select, textarea, [contenteditable]:not([contenteditable='false']), [role='listbox'], [role='menu'], [role='radiogroup'], [role='slider'], [role='tablist'], [role='combobox'], [role='grid'], [role='tree'], [role='dialog'], dialog";

/** What a click in the room area may land on without walking your Ghost there. */
const NOT_EMPTY_SPACE =
  "[data-seat], [data-ghost], button, a, input, select, textarea, label, [role='dialog']";

/**
 * Every Observer's Ghost, drawn over the room area: above the Table, below the Hand and toasts. It
 * covers the room area but ignores the pointer, except on the Ghosts themselves. `tableBox` lays
 * out an inner box exactly over the Table, which Ghosts are positioned on.
 *
 * Each Ghost walks to where the Room says it's heading, turned the way this screen turns the seats.
 * Your own walks where you click in empty room space, or by the arrow keys from anywhere on the page
 * except where they're needed for something else.
 *
 * Clicking a Ghost opens a menu by it, as a Card does: Reactions on your own, things to Throw at
 * anyone else's. Its menu walks with it.
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
  openMenu,
  menuFor,
  onToggleMenu,
  onCloseMenu,
  onSent,
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
  /** Whose menu is open, a Ghost's or a seat's, if any. */
  openMenu: ParticipantId | null;
  /** The menu a Participant's Ghost opens, the same as their Card would. */
  menuFor: (p: ParticipantView) => FunItem[];
  onToggleMenu: (id: ParticipantId) => void;
  onCloseMenu: () => void;
  /** Plays what you just sent at once, rather than waiting for the server's echo. */
  onSent: (event: FunEvent) => void;
}) {
  const [walker] = useState(createGhostWalker);
  /** Whether the open menu shows above its Ghost, as the Ghost was placed when it opened. */
  const [menuAbove, setMenuAbove] = useState(true);
  const withGhosts = participants.filter(
    (p): p is GhostOut => p.ghost !== null,
  );
  // Before the walker's update below, so a Ghost that goes is still being walked, where it stands.
  const { drawn, venting } = useVenting(withGhosts, walker);
  const myGhost = withGhosts.find((p) => p.id === myId)?.ghost ?? null;
  /** The latest `onMove`, so the listeners needn't be added again on every render. */
  const move = useRef(onMove);
  /** Where your own Ghost is heading, which an arrow key hops on from. */
  const heading = useRef(myGhost?.to ?? null);

  // Before paint, so a new Ghost is never drawn anywhere but its place.
  useLayoutEffect(() => {
    move.current = onMove;
    heading.current = myGhost?.to ?? null;
    walker.setFrame(roomRef.current, tableRef.current);
    walker.update(new Map(drawn.map((p) => [p.id, p.ghost.to] as const)), turn);
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

  // The arrow keys walk your Ghost, wherever focus is, unless it's somewhere that needs them.
  useEffect(() => {
    if (!hasGhost) return;
    function onKeyDown(event: KeyboardEvent) {
      const hop = HOPS[event.key];
      const from = heading.current;
      if (!hop || !from || event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
        return;
      const focused = document.activeElement;
      if (focused instanceof Element && focused.closest(KEEPS_ARROWS)) return;
      event.preventDefault();
      const to = walker.hop(from, ...hop);
      if (to) move.current(to, event);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [walker, hasGhost]);

  if (drawn.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", tableBox)}>
      <ul aria-label="Ghosts" className="relative h-full">
        {drawn.map((p) => {
          const isMe = p.id === myId;
          const vented = venting.get(p.id);
          // A Ghost going into a vent is only drawn, out of reach.
          const isOpen = openMenu === p.id && vented !== "in";
          return (
            <li
              key={p.id}
              data-ghost
              data-venting={vented}
              inert={vented === "in"}
              // A click on a Ghost or its menu doesn't close the menu.
              data-menu-host
              // Placed, walked and posed by the walker.
              ref={(element) => walker.setElement(p.id, element)}
              onKeyDown={(event) => {
                if (event.key !== "Escape" || openMenu !== p.id) return;
                onCloseMenu();
                event.currentTarget.querySelector("button")?.focus();
              }}
              className={cn(
                // Drawn in Ghost pixels (see `.ghost-size`), which grow with the seats' Cards. Its
                // name tag stays the page's size, like the seats' name tags.
                // Centred on its point by the middle of its body, with its name tag below.
                "group ghost-size pointer-events-auto absolute flex -translate-x-1/2 -translate-y-[23em] flex-col items-center gap-[2em]",
                // Slightly see-through, so a Result under it stays readable; faded while away.
                p.connected ? "opacity-90" : "opacity-50",
                isOpen && "z-10 opacity-100",
              )}
            >
              {vented && <VentGrate />}
              <button
                aria-label={
                  isMe
                    ? "Your Ghost: send a Reaction"
                    : `Throw something at ${p.name}'s Ghost`
                }
                title={
                  isMe ? "Send a Reaction" : `Throw something at ${p.name}`
                }
                aria-expanded={isOpen}
                onClick={(event) => {
                  // Opens on the side with more room, as this screen shows the Ghost now.
                  const room = roomRef.current?.getBoundingClientRect();
                  const ghost = event.currentTarget.getBoundingClientRect();
                  if (room)
                    setMenuAbove(
                      ghost.top + ghost.height / 2 > room.top + room.height / 2,
                    );
                  onToggleMenu(p.id);
                }}
                className="focus-visible:ring-ring/50 ghost-vent-hole relative cursor-pointer rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-[3px]"
              >
                {/* Rises out of a vent, or sinks into one. */}
                <div className="ghost-vent-body">
                  <div
                    ref={(element) => ghostRef(p.id, element)}
                    // Floats with a slow bob, and trots while walking.
                    className="animate-ghost-bob group-data-walking:animate-ghost-trot motion-reduce:animate-none"
                  >
                    <GhostFigure
                      skin={p.ghost.skin}
                      className="h-[46em] w-[42em]"
                    />
                  </div>
                </div>
              </button>
              <span className="ghost-vent-tag bg-card border-ink font-display shadow-hard-sm max-w-28 truncate rounded-full border-2 px-1.5 text-[0.65rem] leading-tight font-semibold">
                {p.name}
                <span className="sr-only">
                  's Ghost{!p.connected && ", away"}
                </span>
              </span>
              {isOpen && (
                <div
                  className={cn(
                    // In the page's sizes, not the Ghost's.
                    "absolute left-1/2 -translate-x-1/2 text-base",
                    menuAbove ? "bottom-full pb-1" : "top-full pt-1",
                  )}
                >
                  <FunMenu
                    items={menuFor(p)}
                    label={isMe ? "Reactions" : `Throw at ${p.name}`}
                    onSent={onSent}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The vent a Ghost comes out of or goes into, on the floor under it: a rim in the card colour round
 * a dark hole, with slats that slide open and shut. Drawn only while a Ghost is venting.
 */
function VentGrate() {
  return (
    <svg
      viewBox="0 0 56 18"
      aria-hidden
      className="ghost-vent-grate absolute top-[42em] left-1/2 h-[18em] w-[56em] -translate-x-1/2 -translate-y-1/2 overflow-visible"
    >
      <ellipse
        cx="28"
        cy="9"
        rx="26"
        ry="7.5"
        className="fill-card stroke-ink"
        strokeWidth="2.5"
      />
      <ellipse cx="28" cy="9" rx="20" ry="4.6" className="fill-ink" />
      <g
        className="ghost-vent-slats stroke-card"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M14 7.5 V10.5 M20 5.5 V12.5 M26 4.8 V13.2 M32 4.8 V13.2 M38 5.5 V12.5 M44 7.5 V10.5" />
      </g>
    </svg>
  );
}
