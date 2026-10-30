import type {
  ParticipantId,
  ParticipantView,
  RoomSnapshot,
} from "../shared/protocol";
import { cn } from "@/lib/utils";
import { VoteCard } from "./vote-card";

/**
 * The table in the middle of the Room: every Voter's Card at a seat round its edge, you at the
 * bottom nearest your hand. Its centre shows who we're waiting on, then the Result.
 */
export function RoomTable({
  snapshot,
  myId,
}: {
  snapshot: RoomSnapshot;
  myId: ParticipantId;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const seated = [
    ...voters.filter((p) => p.id === myId),
    ...voters.filter((p) => p.id !== myId),
  ];
  const observers = snapshot.participants.filter((p) => p.role === "observer");

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
            return (
              <Seat
                key={p.id}
                participant={p}
                isMe={p.id === myId}
                revealed={snapshot.revealed}
                left={50 + 50 * Math.cos(angle)}
                top={50 + 50 * Math.sin(angle)}
              />
            );
          })}
        </ul>
      </div>
      {observers.length > 0 && (
        <p className="text-muted-foreground absolute top-3 right-6 max-w-[40%] truncate text-xs">
          Watching: {observers.map((p) => p.name).join(", ")}
        </p>
      )}
    </section>
  );
}

function Seat({
  participant: p,
  isMe,
  revealed,
  left,
  top,
}: {
  participant: ParticipantView;
  isMe: boolean;
  revealed: boolean;
  /** Where on the table's edge, as percentages of its box. */
  left: number;
  top: number;
}) {
  return (
    <li
      style={{ left: `${left}%`, top: `${top}%` }}
      className={cn(
        "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1",
        !p.connected && "opacity-50",
      )}
    >
      <VoteCard participant={p} revealed={revealed} size="seat" />
      <span
        className={cn(
          "bg-card border-ink max-w-28 truncate rounded-full border-2 px-2 text-xs",
          isMe && "font-semibold",
        )}
      >
        {p.name}
        {isMe && " (you)"}
      </span>
    </li>
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
