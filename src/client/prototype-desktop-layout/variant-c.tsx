// PROTOTYPE, throw me away. Variant C: a stats header, a board of big Voter tiles (sorted by Vote
// after the Reveal), and the Deck as a vertical rail on the right.
import { Check, Crown, Eye, WifiOff } from "lucide-react";
import { DECK } from "../../shared/deck";
import type { ParticipantView } from "../../shared/protocol";
import { cn } from "@/lib/utils";
import {
  confirmHandOver,
  FacilitatorControls,
  RoleSwitch,
  voterStats,
  type RoomViewProps,
} from "./shared";

export function VariantC(props: RoomViewProps) {
  const { snapshot, me, alerts } = props;
  const { voters, voted, min, max } = voterStats(snapshot);
  const observers = snapshot.participants.filter((p) => p.role === "observer");
  const board = snapshot.revealed
    ? [...voters].sort((a, b) => (a.vote ?? Infinity) - (b.vote ?? Infinity))
    : voters;

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-8 border-b px-8 py-3">
        <h1 className="text-xl font-semibold">Planning Poker</h1>
        <Stat
          label="Result"
          value={snapshot.result?.toFixed(1) ?? "–"}
          unit="h"
          big
        />
        <Stat label="Played" value={`${voted.length}/${voters.length}`} />
        <Stat
          label="Range"
          value={min === null ? "–" : `${min}–${max}`}
          unit={min === null ? undefined : "h"}
        />
        {me.isFacilitator && (
          <div className="ml-auto">
            <FacilitatorControls
              snapshot={snapshot}
              onReveal={props.onReveal}
              onNewRound={props.onNewRound}
              size="lg"
            />
          </div>
        )}
      </header>
      {alerts && <div className="flex flex-col gap-2 px-8 pt-4">{alerts}</div>}

      <div className="flex flex-1">
        <main className="flex-1 p-8 pb-24">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-4">
            {board.map((p) => (
              <Tile
                key={p.id}
                participant={p}
                isMe={p.id === me.id}
                revealed={snapshot.revealed}
                onHandOver={
                  props.onHandOver && !p.isFacilitator
                    ? () => confirmHandOver(p, props.onHandOver)
                    : undefined
                }
              />
            ))}
          </div>
          {observers.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground mr-1 flex items-center gap-1 text-sm">
                <Eye className="size-4" /> Observing
              </span>
              {observers.map((p) => (
                <span
                  key={p.id}
                  className={cn(
                    "group bg-muted flex items-center gap-1 rounded-full px-3 py-1 text-sm",
                    !p.connected && "opacity-50",
                  )}
                >
                  {p.isFacilitator && (
                    <Crown className="size-3.5 text-amber-600" />
                  )}
                  {p.name}
                  {p.id === me.id && " (you)"}
                  {props.onHandOver && !p.isFacilitator && (
                    <button
                      title={`Make ${p.name} the Facilitator`}
                      onClick={() => confirmHandOver(p, props.onHandOver)}
                      className="text-muted-foreground opacity-0 group-hover:opacity-100"
                    >
                      <Crown className="size-3.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </main>

        <aside className="bg-muted/40 flex w-56 flex-col gap-3 border-l p-4 pb-20">
          <p className="text-sm">
            You are <span className="font-semibold">{me.name}</span>
          </p>
          <RoleSwitch
            role={me.role}
            onBecomeVoter={props.onBecomeVoter}
            onBecomeObserver={props.onBecomeObserver}
          />
          {me.role === "voter" ? (
            <>
              <p className="text-muted-foreground mt-2 text-xs">
                {snapshot.revealed
                  ? "Locked until the next Round."
                  : "Your Card, in hours. Secret until the Reveal."}
              </p>
              <div className="flex flex-col gap-1.5">
                {DECK.map((card) => {
                  const selected = card === snapshot.myVote;
                  return (
                    <button
                      key={card}
                      aria-pressed={selected}
                      aria-label={`${card} hours`}
                      disabled={snapshot.revealed}
                      onClick={() => props.onVote(card)}
                      className={cn(
                        "bg-background hover:border-foreground flex h-10 items-center justify-between rounded-md border px-4 text-lg font-semibold disabled:opacity-40",
                        selected &&
                          "bg-primary text-primary-foreground border-primary disabled:opacity-100",
                      )}
                    >
                      {card}
                      <span className="text-xs font-normal opacity-60">h</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-sm">
              You're watching. The Room won't wait for your Vote.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  big,
}: {
  label: string;
  value: string;
  unit?: string;
  big?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs tracking-wide uppercase">
        {label}
      </span>
      <span
        className={cn(
          "font-semibold tabular-nums",
          big ? "text-3xl" : "text-xl",
        )}
      >
        {value}
        {unit && value !== "–" && (
          <span className="text-muted-foreground ml-0.5 text-sm">{unit}</span>
        )}
      </span>
    </div>
  );
}

function Tile({
  participant: p,
  isMe,
  revealed,
  onHandOver,
}: {
  participant: ParticipantView;
  isMe: boolean;
  revealed: boolean;
  onHandOver?: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex aspect-[3/4] flex-col overflow-hidden rounded-xl border-2",
        isMe && "ring-primary ring-2 ring-offset-2",
        !p.connected && "opacity-50",
        p.hasVoted &&
          !revealed &&
          "bg-primary text-primary-foreground border-primary",
        !p.hasVoted && !revealed && "border-dashed",
      )}
    >
      {onHandOver && (
        <button
          title={`Make ${p.name} the Facilitator`}
          aria-label={`Make ${p.name} the Facilitator`}
          onClick={onHandOver}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
        >
          <Crown className="size-4" />
        </button>
      )}
      <div className="flex flex-1 items-center justify-center text-5xl font-semibold">
        {revealed ? (
          (p.vote ?? <span className="text-muted-foreground text-3xl">–</span>)
        ) : p.hasVoted ? (
          <Check className="size-10" aria-label="Voted" />
        ) : (
          <span className="text-muted-foreground text-sm font-normal">
            thinking…
          </span>
        )}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm",
          revealed || !p.hasVoted ? "bg-muted/60" : "bg-black/15",
        )}
      >
        {p.isFacilitator && (
          <Crown
            aria-label="Facilitator"
            className="size-3.5 shrink-0 text-amber-500"
          />
        )}
        {!p.connected && (
          <WifiOff aria-label="Away" className="size-3.5 shrink-0" />
        )}
        <span className="truncate font-medium">
          {p.name}
          {isMe && " (you)"}
        </span>
      </div>
    </div>
  );
}
