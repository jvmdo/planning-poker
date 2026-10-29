// PROTOTYPE, throw me away. Variant A: everyone seated around a poker table, hand of Cards below.
import type { CSSProperties } from "react";
import { Crown, Eye, WifiOff } from "lucide-react";
import type { ParticipantView } from "../../shared/protocol";
import { DECK } from "../../shared/deck";
import { cn } from "@/lib/utils";
import {
  confirmHandOver,
  FacilitatorControls,
  RoleSwitch,
  voterStats,
  type RoomViewProps,
} from "./shared";

export function VariantA(props: RoomViewProps) {
  const { snapshot, me, alerts } = props;
  const seats = snapshot.participants;
  const myIndex = seats.findIndex((p) => p.id === me.id);
  const { voters, voted } = voterStats(snapshot);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-4 border-b px-8 py-3">
        <h1 className="text-xl font-semibold">Planning Poker</h1>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground text-sm">
            Playing as <span className="text-foreground">{me.name}</span>
          </span>
          <RoleSwitch
            role={me.role}
            onBecomeVoter={props.onBecomeVoter}
            onBecomeObserver={props.onBecomeObserver}
          />
        </div>
      </header>
      {alerts && (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-8 pt-4">
          {alerts}
        </div>
      )}

      <section className="flex flex-1 items-center justify-center px-8 py-4">
        <div className="relative aspect-[2.3/1] w-full max-w-5xl">
          <div className="border-muted bg-secondary absolute inset-[16%] flex flex-col items-center justify-center gap-3 rounded-[999px] border-8 shadow-inner">
            {snapshot.revealed ? (
              <p className="flex items-baseline gap-2">
                <span className="text-muted-foreground text-sm">Result</span>
                <span className="text-5xl font-semibold">
                  {snapshot.result?.toFixed(1) ?? "–"}
                </span>
                <span className="text-muted-foreground text-sm">hours</span>
              </p>
            ) : (
              <p className="text-muted-foreground">
                {voted.length} of {voters.length} Voters have played
              </p>
            )}
            {me.isFacilitator && (
              <FacilitatorControls
                snapshot={snapshot}
                onReveal={props.onReveal}
                onNewRound={props.onNewRound}
              />
            )}
          </div>
          {seats.map((p, i) => {
            // Put me at the bottom of the table, nearest my hand.
            const angle =
              Math.PI / 2 + ((i - myIndex) / seats.length) * 2 * Math.PI;
            return (
              <Seat
                key={p.id}
                participant={p}
                isMe={p.id === me.id}
                revealed={snapshot.revealed}
                onHandOver={
                  props.onHandOver && !p.isFacilitator
                    ? () => confirmHandOver(p, props.onHandOver)
                    : undefined
                }
                style={{
                  left: `${50 + 45 * Math.cos(angle)}%`,
                  top: `${50 + 43 * Math.sin(angle)}%`,
                }}
              />
            );
          })}
        </div>
      </section>

      <footer className="bg-muted/40 border-t px-8 pt-6 pb-20">
        {me.role === "voter" ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-muted-foreground text-sm">
              {snapshot.revealed
                ? "Votes are locked until the next Round."
                : "Your hand: an Estimate in hours. Nobody sees it until the Reveal."}
            </p>
            <div className="flex justify-center gap-2">
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
                      "bg-background flex h-28 w-20 items-center justify-center rounded-lg border-2 text-2xl font-semibold shadow-sm transition-transform",
                      !snapshot.revealed && "hover:-translate-y-2",
                      selected &&
                        "bg-primary text-primary-foreground border-primary -translate-y-4 hover:-translate-y-4",
                      snapshot.revealed && !selected && "opacity-40",
                    )}
                  >
                    {card}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            You're observing. The Room won't wait for your Vote.
          </p>
        )}
      </footer>
    </div>
  );
}

function Seat({
  participant: p,
  isMe,
  revealed,
  onHandOver,
  style,
}: {
  participant: ParticipantView;
  isMe: boolean;
  revealed: boolean;
  onHandOver?: () => void;
  style: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "group absolute flex w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1",
        !p.connected && "opacity-50",
      )}
    >
      {p.role === "observer" ? (
        <div className="text-muted-foreground flex h-16 w-12 items-center justify-center">
          <Eye className="size-6" aria-label="Observer" />
        </div>
      ) : revealed && p.vote !== null ? (
        <div className="bg-background flex h-16 w-12 items-center justify-center rounded-md border-2 text-xl font-semibold shadow">
          {p.vote}
        </div>
      ) : p.hasVoted ? (
        <div
          aria-label="Voted"
          className="bg-primary h-16 w-12 rounded-md border-2 border-white bg-[repeating-linear-gradient(45deg,transparent_0_4px,rgb(255_255_255/0.15)_4px_8px)] shadow ring-1 ring-black/20"
        />
      ) : (
        <div
          aria-label={revealed ? "No Vote" : "Not voted yet"}
          className="text-muted-foreground flex h-16 w-12 items-center justify-center rounded-md border-2 border-dashed"
        >
          {revealed ? "–" : ""}
        </div>
      )}
      <div className="flex max-w-full items-center gap-1 text-sm">
        {p.isFacilitator && (
          <Crown aria-label="Facilitator" className="size-3.5 text-amber-600" />
        )}
        {!p.connected && <WifiOff aria-label="Away" className="size-3.5" />}
        <span className={cn("truncate", isMe && "font-semibold")}>
          {p.name}
          {isMe && " (you)"}
        </span>
        {onHandOver && (
          <button
            title={`Make ${p.name} the Facilitator`}
            aria-label={`Make ${p.name} the Facilitator`}
            onClick={onHandOver}
            className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
          >
            <Crown className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
