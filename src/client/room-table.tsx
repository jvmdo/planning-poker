import type {
  ParticipantId,
  ParticipantView,
  RoomSnapshot,
} from "../shared/protocol";
import {
  REACTIONS,
  THROWABLES,
  type FunEvent,
  type Reaction,
  type Throwable,
} from "../shared/fun";
import { useEffect, useRef, useState } from "react";
import { floatReaction, flyThrow } from "./lib/fun-animations";
import { TableSeat, type DeckItem } from "./table-seat";
import { useFunEvents } from "./use-fun-events";

/**
 * The table in the middle of the Room: every Voter's Card at a seat round its edge, you at the
 * bottom nearest your hand. Its centre shows who we're waiting on, then the Result. Your own Card
 * opens a deck of Reactions; anyone else's, a deck of things to Throw at them.
 */
export function RoomTable({
  snapshot,
  myId,
  onReact,
  onThrow,
}: {
  snapshot: RoomSnapshot;
  myId: ParticipantId;
  /** Both say false when nothing was sent, because the burst is used up. */
  onReact: (reaction: Reaction) => boolean;
  onThrow: (to: ParticipantId, item: Throwable) => boolean;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const seated = [
    ...voters.filter((p) => p.id === myId),
    ...voters.filter((p) => p.id !== myId),
  ];
  const observers = snapshot.participants.filter((p) => p.role === "observer");
  const [openSeat, setOpenSeat] = useState<ParticipantId | null>(null);
  const cards = useRef(new Map<ParticipantId, HTMLElement>());
  const watching = useRef<HTMLParagraphElement>(null);

  // One whose sender or target has left the table by now is skipped.
  useFunEvents((event: FunEvent) => {
    if (event.kind === "reaction") {
      const card = cards.current.get(event.from);
      if (card) floatReaction(event.reaction, card);
      return;
    }
    // Observers have no seat, so their Throws come from the "Watching" line.
    const thrower = snapshot.participants.find((p) => p.id === event.from);
    const from =
      thrower?.role === "observer"
        ? watching.current
        : cards.current.get(event.from);
    const to = cards.current.get(event.to);
    if (from && to) flyThrow(THROWABLES[event.item].emoji, from, to);
  });

  // A deck opened by a click closes on a click anywhere outside a seat.
  useEffect(() => {
    if (openSeat === null) return;
    function onPointerDown(event: PointerEvent) {
      if (!(event.target as Element).closest("[data-seat]")) setOpenSeat(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openSeat]);

  function deckFor(p: ParticipantView): DeckItem[] {
    if (p.id === myId)
      return REACTIONS.map((reaction) => ({
        key: reaction,
        emoji: reaction,
        label: `React ${reaction}`,
        onPick: () => onReact(reaction),
      }));
    return (Object.keys(THROWABLES) as Throwable[]).map((item) => ({
      key: item,
      emoji: THROWABLES[item].emoji,
      label: `Throw ${THROWABLES[item].phrase} at ${p.name}`,
      onPick: () => onThrow(p.id, item),
    }));
  }

  return (
    <section
      aria-label="Table"
      // The padding leaves room for the seats, which sit half outside the table's edge.
      className="relative min-h-0 flex-1 px-[clamp(64px,7vw,140px)] pt-[clamp(48px,7vh,90px)] pb-[clamp(40px,6vh,70px)]"
    >
      <div className="border-ink relative h-full rounded-[50%] border-4 bg-[color-mix(in_oklch,var(--pop-3)_22%,var(--background))] shadow-[8px_8px_0_var(--ink)]">
        <div className="absolute inset-[12%_14%] grid place-items-center">
          {snapshot.revealed ? (
            <Result result={snapshot.result} />
          ) : (
            <Waiting voters={voters} />
          )}
        </div>
        <ul aria-label="Voters">
          {seated.map((p, i) => {
            // From the bottom (90°), clockwise round the ellipse.
            const angle = Math.PI / 2 + (i * 2 * Math.PI) / seated.length;
            const isMe = p.id === myId;
            return (
              <TableSeat
                key={p.id}
                participant={p}
                isMe={isMe}
                revealed={snapshot.revealed}
                left={50 + 50 * Math.cos(angle)}
                top={50 + 50 * Math.sin(angle)}
                deck={deckFor(p)}
                deckLabel={isMe ? "Reactions" : `Throw at ${p.name}`}
                cardLabel={
                  isMe
                    ? "Your Card: send a Reaction"
                    : `Throw something at ${p.name}`
                }
                open={openSeat === p.id}
                onToggle={() =>
                  setOpenSeat((open) => (open === p.id ? null : p.id))
                }
                onHover={() => {
                  // Only one deck at a time: moving on closes one a click left open.
                  if (openSeat !== p.id) setOpenSeat(null);
                  const focused = document.activeElement;
                  if (
                    focused instanceof HTMLElement &&
                    focused.closest("[data-seat]") &&
                    !cards.current.get(p.id)?.parentElement?.contains(focused)
                  )
                    focused.blur();
                }}
                onClose={() => setOpenSeat(null)}
                cardRef={(element) => {
                  if (element) cards.current.set(p.id, element);
                  else cards.current.delete(p.id);
                }}
              />
            );
          })}
        </ul>
      </div>
      {observers.length > 0 && (
        <p
          ref={watching}
          className="text-muted-foreground absolute top-3 right-6 max-w-[40%] truncate text-xs"
        >
          Watching: {observers.map((p) => p.name).join(", ")}
        </p>
      )}
    </section>
  );
}

function Waiting({ voters }: { voters: ParticipantView[] }) {
  const played = voters.filter((p) => p.hasVoted).length;
  const waiting = voters.filter((p) => !p.hasVoted);
  return (
    <div className="text-center">
      <p className="font-display text-[clamp(2.5rem,5vw,5rem)] leading-none font-semibold tabular-nums">
        {played}
        <span className="text-muted-foreground">/{voters.length}</span>
        <span className="sr-only"> Voters played</span>
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        {voters.length === 0
          ? "No Voters at the table yet."
          : waiting.length === 0
            ? "Everyone has played. Ready to Reveal."
            : `Waiting on ${waiting.map((p) => p.name).join(", ")}`}
      </p>
    </div>
  );
}

function Result({ result }: { result: number | null }) {
  return (
    <div className="border-ink bg-pop-4 text-ink rounded-[1.2rem] border-[3px] px-[clamp(18px,2vw,36px)] py-[clamp(8px,1.4vh,22px)] text-center shadow-[6px_6px_0_var(--ink)]">
      <p className="text-xs opacity-75">Result</p>
      <p className="font-display animate-pop text-[clamp(2.8rem,5vw,5.5rem)] leading-none font-semibold">
        {result?.toFixed(1) ?? "–"}
      </p>
      <p className="text-xs opacity-75">hours</p>
    </div>
  );
}
