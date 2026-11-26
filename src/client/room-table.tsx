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
import { useEffect, useRef, useState, type RefObject } from "react";
import type { TablePoint } from "../shared/ghost";
import { cn } from "@/lib/utils";
import { earthquake } from "./lib/earthquake";
import { floatReaction, flyThrow } from "./lib/fun-animations";
import { seatLayout } from "./lib/seat-layout";
import type { RoundReading } from "./lib/vote-marks";
import { GhostLayer } from "./ghost-layer";
import type { FunItem } from "./fun-menu";
import { TableSeat } from "./table-seat";
import { useFunEvents } from "./use-fun-events";
import type { PlayingNudge } from "./use-nudges";
import type { PendingCommand } from "./pending";
import { Waiting as Spinner } from "./waiting";
import { Button } from "@/components/ui/button";

/** Leaves room round the Table for the seats, which sit half outside its edge. */
const ROOM_AROUND_TABLE =
  "px-[clamp(64px,7vw,140px)] pt-[clamp(48px,7vh,90px)] pb-[clamp(40px,6vh,70px)]";

/** A click comes this soon after the press it started with. */
const CLICK_AFTER_PRESS_MS = 1000;

/**
 * Lifts the Table's Reveal and New Round above the Ghost layer: Ghosts walk under them, as under
 * the Hand, so a parked Ghost never blocks the Round. The Result and the waiting line stay under
 * Ghosts, which are see-through enough to read them.
 */
const ABOVE_GHOSTS = "relative z-20";

/**
 * The table in the middle of the Room: every Voter's Card at a seat round its edge, you at the
 * bottom nearest your hand. Its centre shows who we're waiting on and Auto Reveal's countdown, then
 * the Result; the Facilitator gets Reveal there while voting, and New Round after. Your own Card or
 * Ghost opens a menu of Reactions; anyone else's, a menu of things to Throw at them.
 */
export function RoomTable({
  snapshot,
  nudge,
  round,
  myId,
  roomRef,
  isFacilitator,
  locked,
  pendingCommand,
  onReveal,
  onNewRound,
  onReact,
  onThrow,
  onMoveGhost,
}: {
  snapshot: RoomSnapshot;
  /** The burst of Nudges playing, if any: an earthquake at the Holdout's seat. */
  nudge: PlayingNudge | null;
  round: RoundReading;
  myId: ParticipantId;
  /** The room area round the Table, the strip under it included, where Ghosts walk. */
  roomRef: RefObject<HTMLElement | null>;
  isFacilitator: boolean;
  /** Something is waiting on the server, or the connection is down: nothing can be sent. */
  locked: boolean;
  pendingCommand: PendingCommand["command"] | null;
  onReveal: () => void;
  onNewRound: () => void;
  /** Both say false when nothing was sent, because the burst is used up. True plays it at once. */
  onReact: (reaction: Reaction) => boolean;
  onThrow: (to: ParticipantId, item: Throwable) => boolean;
  /** Sends your own Ghost walking to a point on the shared Table. */
  onMoveGhost: (to: TablePoint) => void;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const { seats, turn } = seatLayout(snapshot.participants, myId);
  const everyVoterVoted = voters.length > 0 && voters.every((p) => p.hasVoted);
  /**
   * Your own last Vote shows before the server's answer, and so does the countdown it starts, so
   * "Ready to Reveal" never flashes in between.
   */
  const countingDown =
    snapshot.countingDown ||
    (snapshot.autoReveal && snapshot.hasFacilitator && everyVoterVoted);
  // An Observer whose Ghost is out is shown by their Ghost instead.
  const watchers = snapshot.participants.filter(
    (p) => p.role === "observer" && p.ghost === null,
  );
  /** Whose menu a click opened, at their seat or their Ghost. */
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null);
  // A menu whose seat or Ghost has gone closes, so it doesn't open again when they come back.
  if (openMenu && !hasPlace(snapshot.participants, openMenu)) setOpenMenu(null);
  const openAt = (on: OpenMenu["on"]) =>
    openMenu?.on === on ? openMenu.id : null;
  const toggleMenu = (id: ParticipantId, on: OpenMenu["on"]) =>
    setOpenMenu((open) =>
      open?.id === id && open.on === on ? null : { id, on },
    );
  const cards = useRef(new Map<ParticipantId, HTMLElement>());
  const ghosts = useRef(new Map<ParticipantId, HTMLElement>());
  const watching = useRef<HTMLParagraphElement>(null);
  const table = useRef<HTMLDivElement>(null);
  /** Stops the earthquake playing at a Holdout's seat, if one is. */
  const stopEarthquake = useRef<(() => void) | null>(null);
  /** When a click outside the seats last closed a menu: that click does nothing else. */
  const closedMenuAt = useRef(-Infinity);

  /**
   * Where a Participant is on screen, for Reactions and Throws to start from and land on: a Voter
   * at their Card, an Observer at their Ghost while it's out, or else on the "Watching" line.
   * Nowhere once they've left.
   */
  function placeOf(id: ParticipantId): HTMLElement | null {
    const participant = snapshot.participants.find((p) => p.id === id);
    if (!participant) return null;
    if (participant.ghost) return ghosts.current.get(id) ?? null;
    if (participant.role === "observer") return watching.current;
    return cards.current.get(id) ?? null;
  }

  /** Animates a Reaction or Throw. One whose sender or target has left the table is skipped. */
  function play(event: FunEvent) {
    // A Nudge plays as a burst (see below).
    if (event.kind === "nudge") return;
    const from = placeOf(event.from);
    if (!from) return;
    if (event.kind === "reaction") {
      floatReaction(event.reaction, from);
      return;
    }
    const to = placeOf(event.to);
    if (to) flyThrow(THROWABLES[event.item].emoji, from, to);
  }

  // Your own already played on the click, without waiting for the server, so its echo is skipped.
  useFunEvents((event) => {
    if (event.from !== myId) play(event);
  });

  // A burst of Nudges is an earthquake at the Holdout's seat, except on their own screen, which
  // shakes instead. Each time the burst grows, it starts again at the burst's level, never stacked.
  useEffect(() => {
    if (!nudge || nudge.to === myId) return;
    const card = cards.current.get(nudge.to);
    if (!card || !table.current) return;
    stopEarthquake.current?.();
    stopEarthquake.current = earthquake(card, table.current, nudge.level);
  }, [nudge, myId]);

  // It stops at once when the Holdout's Vote lands or the Round is Revealed, as their shake does,
  // and when the Table goes.
  const holdoutAnswered =
    snapshot.revealed ||
    !!snapshot.participants.find((p) => p.id === nudge?.to)?.hasVoted;
  useEffect(() => {
    if (holdoutAnswered) stopEarthquake.current?.();
  }, [holdoutAnswered]);
  useEffect(() => () => stopEarthquake.current?.(), []);

  // A menu opened by a click closes on a click anywhere outside a seat or Ghost.
  useEffect(() => {
    if (openMenu === null) return;
    function onPointerDown(event: PointerEvent) {
      if ((event.target as Element).closest("[data-menu-host]")) return;
      setOpenMenu(null);
      closedMenuAt.current = event.timeStamp;
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [openMenu]);

  function menuFor(p: ParticipantView): FunItem[] {
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
      className={cn("relative min-h-0 flex-1", ROOM_AROUND_TABLE)}
    >
      <div
        ref={table}
        className="border-ink relative h-full rounded-[50%] border-4 bg-[color-mix(in_oklch,var(--pop-3)_22%,var(--background))] shadow-[8px_8px_0_var(--ink)]"
      >
        <div className="absolute inset-[12%_14%] grid place-items-center">
          {snapshot.revealed ? (
            <div className="flex flex-col items-center gap-3">
              <Result result={snapshot.result} />
              {isFacilitator && (
                <Button
                  className={ABOVE_GHOSTS}
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
                  className={ABOVE_GHOSTS}
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
          {seats.map(({ participant: p, x, y }) => {
            const isMe = p.id === myId;
            return (
              <TableSeat
                key={p.id}
                participant={p}
                isMe={isMe}
                revealed={snapshot.revealed}
                mark={round.markOf(p.id)}
                left={100 * x}
                top={100 * y}
                menu={menuFor(p)}
                menuLabel={isMe ? "Reactions" : `Throw at ${p.name}`}
                cardLabel={
                  isMe
                    ? "Your Card: send a Reaction"
                    : `Throw something at ${p.name}`
                }
                open={openAt("seat") === p.id}
                onToggle={() => toggleMenu(p.id, "seat")}
                onHover={() => {
                  // Only one menu at a time: moving on closes one a click left open.
                  if (openAt("seat") !== p.id) setOpenMenu(null);
                  const focused = document.activeElement;
                  if (
                    focused instanceof HTMLElement &&
                    focused.closest("[data-seat]") &&
                    !cards.current.get(p.id)?.parentElement?.contains(focused)
                  )
                    focused.blur();
                }}
                onClose={() => setOpenMenu(null)}
                onSent={play}
                cardRef={(element) => {
                  if (element) cards.current.set(p.id, element);
                  else cards.current.delete(p.id);
                }}
              />
            );
          })}
        </ul>
      </div>
      <GhostLayer
        participants={snapshot.participants}
        myId={myId}
        turn={turn}
        tableBox={ROOM_AROUND_TABLE}
        roomRef={roomRef}
        tableRef={table}
        onMove={(to, event) => {
          // The click that closed a menu isn't also a walk.
          const closedAMenu =
            event.type === "click" &&
            event.timeStamp - closedMenuAt.current < CLICK_AFTER_PRESS_MS;
          if (!closedAMenu) onMoveGhost(to);
        }}
        ghostRef={(id, element) => {
          if (element) ghosts.current.set(id, element);
          else ghosts.current.delete(id);
        }}
        openMenu={openAt("ghost")}
        menuFor={menuFor}
        onToggleMenu={(id) => toggleMenu(id, "ghost")}
        onCloseMenu={() => setOpenMenu(null)}
        onSent={play}
      />
      {watchers.length > 0 && (
        <p
          ref={watching}
          className="text-muted-foreground absolute top-3 right-6 max-w-[40%] truncate text-xs"
        >
          Watching: {watchers.map((p) => p.name).join(", ")}
        </p>
      )}
    </section>
  );
}

interface OpenMenu {
  id: ParticipantId;
  on: "seat" | "ghost";
}

/** Whether a menu's seat or Ghost is still on the Table. */
function hasPlace(participants: ParticipantView[], menu: OpenMenu) {
  const p = participants.find((p) => p.id === menu.id);
  if (!p) return false;
  return menu.on === "ghost" ? p.ghost !== null : p.role === "voter";
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
