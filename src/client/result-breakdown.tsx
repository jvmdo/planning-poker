import type { RoomSnapshot } from "../shared/protocol";
import { DECK } from "../shared/deck";

/** After the Reveal: the Result, the range of Votes, and who played which Card. */
export function ResultBreakdown({
  snapshot,
  isVoter,
}: {
  snapshot: RoomSnapshot;
  isVoter: boolean;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const votes = voters.flatMap((p) => (p.vote === null ? [] : [p.vote]));
  const groups = DECK.map((card) => ({
    card,
    names: voters.filter((p) => p.vote === card).map((p) => p.name),
  })).filter((g) => g.names.length > 0);
  const most = Math.max(1, ...groups.map((g) => g.names.length));
  const missing = voters.filter((p) => p.vote === null);

  return (
    <div className="flex max-w-5xl gap-10">
      <div className="flex w-64 shrink-0 flex-col gap-4">
        <div className="rounded-xl border p-6">
          <p className="text-muted-foreground text-sm">Result</p>
          <p className="text-7xl font-semibold">
            {snapshot.result?.toFixed(1) ?? "–"}
          </p>
          <p className="text-muted-foreground text-sm">hours</p>
        </div>
        {votes.length > 0 && (
          <p className="text-muted-foreground text-sm">
            Range {Math.min(...votes)}–{Math.max(...votes)} hours
          </p>
        )}
        {isVoter && (
          <p className="text-muted-foreground text-sm">
            Your Vote: {snapshot.myVote ?? "none"}
          </p>
        )}
      </div>
      <section className="flex flex-1 flex-col gap-3">
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
      </section>
    </div>
  );
}
