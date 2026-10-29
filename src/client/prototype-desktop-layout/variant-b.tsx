// PROTOTYPE, throw me away. Variant B: Participants in a left sidebar; the stage swaps between
// a big Deck while voting and a Result breakdown after the Reveal.
import { Check, Clock, Crown, Eye, WifiOff } from "lucide-react";
import { DECK } from "../../shared/deck";
import { cn } from "@/lib/utils";
import {
  confirmHandOver,
  FacilitatorControls,
  RoleSwitch,
  voterStats,
  type RoomViewProps,
} from "./shared";

export function VariantB(props: RoomViewProps) {
  const { snapshot, me, alerts } = props;
  const { voters, voted, waiting, min, max } = voterStats(snapshot);
  const progress = voters.length ? (voted.length / voters.length) * 100 : 0;

  return (
    <div className="grid min-h-svh grid-cols-[300px_1fr]">
      <aside className="bg-muted/40 flex flex-col border-r">
        <h1 className="border-b px-5 py-4 text-lg font-semibold">
          Planning Poker
        </h1>
        <p className="text-muted-foreground px-5 pt-4 pb-2 text-xs font-medium tracking-wide uppercase">
          Participants · {snapshot.participants.length}
        </p>
        <ul className="flex-1 overflow-y-auto px-2">
          {snapshot.participants.map((p) => (
            <li
              key={p.id}
              className={cn(
                "group hover:bg-background flex items-center gap-2 rounded-md px-3 py-1.5 text-sm",
                !p.connected && "opacity-50",
              )}
            >
              {p.role === "observer" ? (
                <Eye
                  aria-label="Observer"
                  className="text-muted-foreground size-4"
                />
              ) : p.hasVoted ? (
                <Check aria-label="Voted" className="size-4 text-emerald-600" />
              ) : (
                <Clock
                  aria-label="Not voted yet"
                  className="text-muted-foreground size-4"
                />
              )}
              <span
                className={cn("truncate", p.id === me.id && "font-semibold")}
              >
                {p.name}
                {p.id === me.id && " (you)"}
              </span>
              {p.isFacilitator && (
                <Crown
                  aria-label="Facilitator"
                  className="size-3.5 shrink-0 text-amber-600"
                />
              )}
              {!p.connected && (
                <WifiOff aria-label="Away" className="size-3.5 shrink-0" />
              )}
              {props.onHandOver && !p.isFacilitator && (
                <button
                  title={`Make ${p.name} the Facilitator`}
                  aria-label={`Make ${p.name} the Facilitator`}
                  onClick={() => confirmHandOver(p, props.onHandOver)}
                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                >
                  <Crown className="size-3.5" />
                </button>
              )}
              {snapshot.revealed && p.role === "voter" && (
                <span className="ml-auto font-semibold tabular-nums">
                  {p.vote ?? "–"}
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t p-4 pb-16">
          <p className="text-sm">
            You are <span className="font-semibold">{me.name}</span>
          </p>
          <RoleSwitch
            role={me.role}
            onBecomeVoter={props.onBecomeVoter}
            onBecomeObserver={props.onBecomeObserver}
          />
        </div>
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center gap-4 border-b px-8 py-4">
          <div>
            <p className="text-lg font-semibold">
              {snapshot.revealed ? "Votes revealed" : "Voting"}
            </p>
            <p className="text-muted-foreground text-sm">
              {voted.length} of {voters.length} Voters played
              {!snapshot.revealed && waiting.length > 0 && (
                <> · waiting on {waiting.map((p) => p.name).join(", ")}</>
              )}
            </p>
          </div>
          {me.isFacilitator && (
            <div className="ml-auto">
              <FacilitatorControls
                snapshot={snapshot}
                onReveal={props.onReveal}
                onNewRound={props.onNewRound}
              />
            </div>
          )}
        </div>
        <div className="bg-muted h-1">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {alerts && (
          <div className="flex flex-col gap-2 px-8 pt-4">{alerts}</div>
        )}

        <div className="flex-1 p-8 pb-24">
          {snapshot.revealed ? (
            <div className="flex max-w-5xl gap-10">
              <div className="flex w-64 shrink-0 flex-col gap-4">
                <div className="rounded-xl border p-6">
                  <p className="text-muted-foreground text-sm">Result</p>
                  <p className="text-7xl font-semibold">
                    {snapshot.result?.toFixed(1) ?? "–"}
                  </p>
                  <p className="text-muted-foreground text-sm">hours</p>
                </div>
                {min !== null && (
                  <p className="text-muted-foreground text-sm">
                    Range {min}–{max} hours
                  </p>
                )}
                {me.role === "voter" && (
                  <p className="text-muted-foreground text-sm">
                    Your Vote: {snapshot.myVote ?? "none"}
                  </p>
                )}
              </div>
              <Distribution {...props} />
            </div>
          ) : me.role === "voter" ? (
            <div className="max-w-4xl">
              <h2 className="mb-1 text-xl font-semibold">Pick your Card</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Estimate in hours. Nobody sees it until the Reveal.
              </p>
              <div className="grid grid-cols-6 gap-4">
                {DECK.map((card) => {
                  const selected = card === snapshot.myVote;
                  return (
                    <button
                      key={card}
                      aria-pressed={selected}
                      aria-label={`${card} hours`}
                      onClick={() => props.onVote(card)}
                      className={cn(
                        "hover:border-foreground flex aspect-[3/4] flex-col items-center justify-center rounded-xl border-2 text-4xl font-semibold transition-colors",
                        selected &&
                          "bg-primary text-primary-foreground border-primary",
                      )}
                    >
                      {card}
                      <span className="mt-1 text-xs font-normal opacity-60">
                        hours
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              You're observing. The Room won't wait for your Vote.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

function Distribution({ snapshot }: RoomViewProps) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const groups = DECK.map((card) => ({
    card,
    names: voters.filter((p) => p.vote === card).map((p) => p.name),
  })).filter((g) => g.names.length > 0);
  const most = Math.max(1, ...groups.map((g) => g.names.length));
  const missing = voters.filter((p) => p.vote === null);

  return (
    <div className="flex flex-1 flex-col gap-3">
      <h2 className="font-semibold">How the team voted</h2>
      {groups.map((g) => (
        <div key={g.card} className="flex items-center gap-3">
          <span className="w-10 text-right text-lg font-semibold tabular-nums">
            {g.card}
          </span>
          <div className="flex flex-1 items-center gap-3">
            <div
              className="bg-primary h-8 rounded"
              style={{ width: `${(g.names.length / most) * 60}%` }}
            />
            <span className="text-muted-foreground text-sm">
              {g.names.join(", ")}
            </span>
          </div>
        </div>
      ))}
      {missing.length > 0 && (
        <p className="text-muted-foreground mt-2 text-sm">
          No Vote: {missing.map((p) => p.name).join(", ")}
        </p>
      )}
    </div>
  );
}
