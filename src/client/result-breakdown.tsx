import type { ParticipantId, RoomSnapshot } from "../shared/protocol";
import { cn } from "@/lib/utils";
import { popBackground } from "./lib/pop";
import { MARK_COLOURS, type RoundReading } from "./lib/vote-marks";

/**
 * In the hand's place after the Reveal: a bar for each Card played, how the Votes came out with
 * the Outliers to ask, and who didn't vote. The Result itself is on the table.
 */
export function ResultBreakdown({
  snapshot,
  round,
  myId,
}: {
  snapshot: RoomSnapshot;
  round: RoundReading;
  myId: ParticipantId;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const groups = snapshot.deck
    .map((card) => ({
      card,
      names: voters.filter((p) => p.vote === card).map((p) => p.name),
    }))
    .filter((g) => g.names.length > 0);
  // When some Cards are marked, only their bars are coloured, matching the Cards on the table.
  const anyMarked = groups.some((g) => round.markOfCard(g.card) !== null);
  function barFill(card: number, index: number) {
    const mark = round.markOfCard(card);
    if (mark) return MARK_COLOURS[mark].fill;
    return anyMarked ? "bg-card" : popBackground(index);
  }
  const most = Math.max(1, ...groups.map((g) => g.names.length));
  const missing = voters.filter((p) => p.vote === null);

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
                barFill(g.card, index),
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
        <AgreementMessage round={round} myId={myId} />
        {missing.length > 0 && (
          <p className="text-muted-foreground text-xs">
            No Vote: {missing.map((p) => p.name).join(", ")}
          </p>
        )}
      </div>
    </section>
  );
}

/** What the team should do about how the Votes came out. */
function AgreementMessage({
  round: { agreement, outlierNames, markOf },
  myId,
}: {
  round: RoundReading;
  myId: ParticipantId;
}) {
  const heading = "font-display text-lg font-semibold";
  switch (agreement.kind) {
    case "too-few":
      return null;
    case "everyone-agrees":
      return <p className={heading}>Everyone agrees 🎯</p>;
    case "nearly-agrees":
      return <p className={heading}>Nearly everyone agrees</p>;
    case "outliers":
      return (
        <>
          <p className={heading}>Ask {listNames(outlierNames)} why</p>
          {markOf(myId) === "outlier" && (
            <p className="text-muted-foreground">
              You're an Outlier, tell the team why 🙋
            </p>
          )}
        </>
      );
    case "split":
      return (
        <p className={heading}>
          Split between {agreement.camps[0]}h and {agreement.camps[1]}h
        </p>
      );
    case "no-consensus":
      return (
        <>
          <p className={heading}>
            No consensus: {agreement.lowest}h to {agreement.highest}h
          </p>
          <p className="text-muted-foreground">
            Talk it through and vote again.
          </p>
        </>
      );
  }
}

/** "Ana", "Ana and Bruno", "Ana, Bruno and Carla". */
function listNames(names: string[]) {
  return names.length < 2
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}
