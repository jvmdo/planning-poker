import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { ParticipantId, ParticipantView } from "../shared/protocol";
import type { FunEvent } from "../shared/fun";
import type { GhostView, TablePoint } from "../shared/ghost";
import { cn } from "@/lib/utils";
import { createGhostWalker } from "./lib/ghost-walker";
import { DeckFan, type DeckItem } from "./deck-fan";
import { GhostFigure } from "./ghost-figure";

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
 * Clicking a Ghost opens a deck by it, as a Card does: Reactions on your own, things to Throw at
 * anyone else's. Its deck walks with it.
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
  openDeck,
  deckFor,
  onToggleDeck,
  onCloseDeck,
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
  /** Whose deck is open, a Ghost's or a seat's, if any. */
  openDeck: ParticipantId | null;
  /** The deck a Participant's Ghost opens, the same as their Card would. */
  deckFor: (p: ParticipantView) => DeckItem[];
  onToggleDeck: (id: ParticipantId) => void;
  onCloseDeck: () => void;
  /** Plays what you just sent at once, rather than waiting for the server's echo. */
  onSent: (event: FunEvent) => void;
}) {
  const [walker] = useState(createGhostWalker);
  /** Whether the open deck shows above its Ghost, as the Ghost was placed when it opened. */
  const [deckAbove, setDeckAbove] = useState(true);
  const withGhosts = participants.filter(
    (p): p is ParticipantView & { ghost: GhostView } => p.ghost !== null,
  );
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

  if (withGhosts.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", tableBox)}>
      <ul aria-label="Ghosts" className="relative h-full">
        {withGhosts.map((p) => {
          const isMe = p.id === myId;
          const isOpen = openDeck === p.id;
          return (
            <li
              key={p.id}
              data-ghost
              // A click on a Ghost or its deck doesn't close the deck.
              data-deck-host
              // Placed, walked and posed by the walker.
              ref={(element) => walker.setElement(p.id, element)}
              onKeyDown={(event) => {
                if (event.key !== "Escape" || openDeck !== p.id) return;
                onCloseDeck();
                event.currentTarget.querySelector("button")?.focus();
              }}
              className={cn(
                // Centred on its point by the middle of its body, with its name tag below.
                "group pointer-events-auto absolute flex -translate-x-1/2 -translate-y-[23px] flex-col items-center gap-0.5",
                // Slightly see-through, so a Result under it stays readable; faded while away.
                p.connected ? "opacity-90" : "opacity-50",
                isOpen && "z-10 opacity-100",
              )}
            >
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
                    setDeckAbove(
                      ghost.top + ghost.height / 2 > room.top + room.height / 2,
                    );
                  onToggleDeck(p.id);
                }}
                className="focus-visible:ring-ring/50 cursor-pointer rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-[3px]"
              >
                <div
                  ref={(element) => ghostRef(p.id, element)}
                  // Floats with a slow bob, and trots while walking.
                  className="animate-ghost-bob group-data-walking:animate-ghost-trot motion-reduce:animate-none"
                >
                  <GhostFigure
                    skin={p.ghost.skin}
                    className="h-[46px] w-[42px]"
                  />
                </div>
              </button>
              <span className="bg-card border-ink font-display shadow-hard-sm max-w-28 truncate rounded-full border-2 px-1.5 text-[0.65rem] leading-tight font-semibold">
                {p.name}
                <span className="sr-only">
                  's Ghost{!p.connected && ", away"}
                </span>
              </span>
              {isOpen && (
                <div
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2",
                    deckAbove ? "bottom-full pb-1" : "top-full pt-1",
                  )}
                >
                  <DeckFan
                    deck={deckFor(p)}
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
