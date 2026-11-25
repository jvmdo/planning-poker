import {
  AUTO_REVEAL_DELAY_MS,
  type ParticipantId,
  type ParticipantView,
  type RoomSnapshot,
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
import type { RoundReading } from "./lib/vote-marks";
import { TableSeat, type DeckItem } from "./table-seat";
import { useFunEvents } from "./use-fun-events";
import type { PendingCommand } from "./pending";
import { Waiting as Spinner } from "./waiting";
import { Button } from "@/components/ui/button";

/**
 * The table in the middle of the Room: every Voter's Card at a seat round its edge, you at the
 * bottom nearest your hand. Its centre shows who we're waiting on and Auto Reveal's countdown, then
 * the Result; the Facilitator gets Reveal there while voting, and New Round after. Your own Card
 * opens a deck of Reactions; anyone else's, a deck of things to Throw at them.
 */
export function RoomTable({
  snapshot,
  round,
  myId,
  isFacilitator,
  locked,
  pendingCommand,
  onReveal,
  onNewRound,
  onReact,
  onThrow,
}: {
  snapshot: RoomSnapshot;
  round: RoundReading;
  myId: ParticipantId;
  isFacilitator: boolean;
  /** Something is waiting on the server, or the connection is down: nothing can be sent. */
  locked: boolean;
  pendingCommand: PendingCommand["command"] | null;
  onReveal: () => void;
  onNewRound: () => void;
  /** Both say false when nothing was sent, because the burst is used up. True plays it at once. */
  onReact: (reaction: Reaction) => boolean;
  onThrow: (to: ParticipantId, item: Throwable) => boolean;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const seated = [
    ...voters.filter((p) => p.id === myId),
    ...voters.filter((p) => p.id !== myId),
  ];
  const observers = snapshot.participants.filter((p) => p.role === "observer");
  const everyVoterVoted = voters.length > 0 && voters.every((p) => p.hasVoted);
  /**
   * Your own last Vote shows before the server's answer, and so does the countdown it starts, so
   * "Ready to Reveal" never flashes in between.
   */
  const countingDown =
    snapshot.countingDown ||
    (snapshot.autoReveal && snapshot.hasFacilitator && everyVoterVoted);
  const [openSeat, setOpenSeat] = useState<ParticipantId | null>(null);
  const cards = useRef(new Map<ParticipantId, HTMLElement>());
  const watching = useRef<HTMLParagraphElement>(null);

  /** Animates a Reaction or Throw. One whose sender or target has left the table is skipped. */
  function play(event: FunEvent) {
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
  }

  // Your own already played on the click, without waiting for the server, so its echo is skipped.
  useFunEvents((event) => {
    if (event.from !== myId) play(event);
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
        onPick: () =>
          onReact(reaction) ? { kind: "reaction", from: myId, reaction } : null,
      }));
    return (Object.keys(THROWABLES) as Throwable[]).map((item) => ({
      key: item,
      emoji: THROWABLES[item].emoji,
      label: `Throw ${THROWABLES[item].phrase} at ${p.name}`,
      onPick: () =>
        onThrow(p.id, item)
          ? { kind: "throw", from: myId, to: p.id, item }
          : null,
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
            <div className="flex flex-col items-center gap-3">
              <Result result={snapshot.result} />
              {isFacilitator && (
                <Button
                  onClick={onNewRound}
                  disabled={locked}
                  aria-busy={pendingCommand === "newRound"}
                >
                  {pendingCommand === "newRound" && <Spinner />}
                  New Round
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Waiting voters={voters} countingDown={countingDown} />
              {isFacilitator && (
                <Button
                  onClick={onReveal}
                  disabled={locked || !voters.some((p) => p.hasVoted)}
                  aria-busy={pendingCommand === "reveal"}
                >
                  {pendingCommand === "reveal" && <Spinner />}
                  Reveal
                </Button>
              )}
            </div>
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
                mark={round.markOf(p.id)}
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
                onSent={(event) => play(event)}
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

/**
 * The seconds left in Auto Reveal's countdown, counted by this browser from when it saw the
 * countdown start, so clocks needn't agree. Null while there's no countdown.
 */
function useSecondsLeft(countingDown: boolean): number | null {
  const full = AUTO_REVEAL_DELAY_MS / 1000;
  const [secondsLeft, setSecondsLeft] = useState(full);
  useEffect(() => {
    if (!countingDown) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const left = AUTO_REVEAL_DELAY_MS - (Date.now() - start);
      setSecondsLeft(Math.max(1, Math.ceil(left / 1000)));
    }, 200);
    return () => {
      clearInterval(timer);
      setSecondsLeft(full);
    };
  }, [countingDown, full]);
  return countingDown ? secondsLeft : null;
}

function Waiting({
  voters,
  countingDown,
}: {
  voters: ParticipantView[];
  countingDown: boolean;
}) {
  const played = voters.filter((p) => p.hasVoted).length;
  const waiting = voters.filter((p) => !p.hasVoted);
  const secondsLeft = useSecondsLeft(countingDown);
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
          : secondsLeft !== null
            ? `Everyone has played. Revealing in ${secondsLeft}…`
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
