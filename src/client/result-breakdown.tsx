import type { RoomSnapshot } from "../shared/protocol";
import { cn } from "@/lib/utils";
import { DECK } from "../shared/deck";
import { popBackground } from "./lib/pop";

/**
 * In the hand's place after the Reveal: a bar for each Card played, the spread with who to ask
 * about it, and who didn't vote. The Result itself is on the table.
 */
export function ResultBreakdown({ snapshot }: { snapshot: RoomSnapshot }) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const votes = voters.flatMap((p) => (p.vote === null ? [] : [p.vote]));
  const groups = DECK.map((card) => ({
    card,
    names: voters.filter((p) => p.vote === card).map((p) => p.name),
  })).filter((g) => g.names.length > 0);
  const most = Math.max(1, ...groups.map((g) => g.names.length));
  const missing = voters.filter((p) => p.vote === null);
  const low = Math.min(...votes);
  const high = Math.max(...votes);
  const namesAt = (card: number) =>
    groups.find((g) => g.card === card)?.names.join(", ");

  return (
    <section
      aria-labelledby="breakdown-heading"
      className="flex h-full items-stretch justify-center gap-[clamp(24px,4vw,72px)] px-8 pb-[clamp(16px,3vh,32px)]"
    >
      <h2 id="breakdown-heading" className="sr-only">
        How the team voted
      </h2>
      <ul className="flex items-end gap-[clamp(8px,1vw,16px)]">
        {groups.map((g, index) => (
          <li
            key={g.card}
            title={g.names.join(", ")}
            className="flex h-full flex-col items-center justify-end gap-1"
          >
            <span className="text-muted-foreground text-xs tabular-nums">
              ×{g.names.length}
              <span className="sr-only">
                {" "}
                played {g.card} hours: {g.names.join(", ")}
              </span>
            </span>
            <div
              aria-hidden
              className={cn(
                "border-ink shadow-hard-sm animate-grow-up w-[clamp(28px,2.6vw,48px)] origin-bottom rounded-t-lg border-[3px]",
                popBackground(index),
              )}
              style={{ height: `${(g.names.length / most) * 60}%` }}
            />
            <span
              aria-hidden
              className="font-display text-base font-semibold tabular-nums"
            >
              {g.card}
            </span>
          </li>
        ))}
      </ul>
      <div className="flex max-w-80 flex-col justify-center gap-1.5 text-sm">
        {votes.length > 1 && low !== high && (
          <>
            <p className="font-display text-lg font-semibold">
              Spread {low}–{high} hours
            </p>
            <p className="text-muted-foreground">
              Ask {namesAt(low)} and {namesAt(high)} why.
            </p>
          </>
        )}
        {votes.length > 1 && low === high && (
          <p className="font-display text-lg font-semibold">
            Everyone agrees 🎯
          </p>
        )}
        {missing.length > 0 && (
          <p className="text-muted-foreground text-xs">
            No Vote: {missing.map((p) => p.name).join(", ")}
          </p>
        )}
      </div>
    </section>
  );
}
