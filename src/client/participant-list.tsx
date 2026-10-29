import {
  GRACE_PERIOD_MS,
  type ParticipantId,
  type ParticipantView,
} from "../shared/protocol";
import { Crown, Eye, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Who's in the Room. Each Voter has a little Card at the end of their row: an empty slot until they
 * play, face-down once they have, face-up with their Vote after the Reveal.
 */
export function ParticipantList({
  participants,
  myId,
  revealed,
  onHandOver,
}: {
  participants: ParticipantView[];
  myId: ParticipantId;
  revealed: boolean;
  /** Only given to the Facilitator, who can hand the role to anyone else. */
  onHandOver?: (to: ParticipantId) => void;
}) {
  const voters = participants.filter((p) => p.role === "voter");
  const played = voters.filter((p) => p.hasVoted).length;

  function handOverLabel(p: ParticipantView) {
    return `Make ${p.name} the Facilitator`;
  }

  function confirmHandOver(p: ParticipantView) {
    if (window.confirm(`${handOverLabel(p)}?`)) onHandOver?.(p.id);
  }

  return (
    <section aria-labelledby="participants-heading" className="min-h-0 flex-1">
      <h2
        id="participants-heading"
        className="text-muted-foreground flex px-5 pt-4 pb-2 text-xs font-bold tracking-wide uppercase"
      >
        Participants · {participants.length}
        {!revealed && voters.length > 0 && (
          <span className="text-foreground ml-auto">
            {played}/{voters.length} played
          </span>
        )}
      </h2>
      <ul className="flex flex-col gap-1 overflow-y-auto px-2">
        {participants.map((p) => (
          <li
            key={p.id}
            className={cn(
              "group hover:bg-background flex h-10 items-center gap-2 rounded-xl px-3 text-sm",
              !p.connected && "opacity-50",
            )}
          >
            <span className={cn("truncate", p.id === myId && "font-semibold")}>
              {p.name}
              {p.id === myId && " (you)"}
            </span>
            {p.isFacilitator && (
              <Crown
                aria-label="Facilitator"
                className="size-3.5 shrink-0 text-amber-600"
              />
            )}
            {!p.connected && (
              <span
                title={`Reconnecting. Removed after ${GRACE_PERIOD_MS / 1000} seconds away.`}
              >
                <WifiOff aria-label="Away" className="size-3.5 shrink-0" />
              </span>
            )}
            {onHandOver && !p.isFacilitator && (
              <button
                aria-label={handOverLabel(p)}
                title={handOverLabel(p)}
                onClick={() => confirmHandOver(p)}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              >
                <Crown aria-hidden className="size-3.5" />
              </button>
            )}
            <span className="ml-auto flex shrink-0 items-center">
              <VoteStatus participant={p} revealed={revealed} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Small Cards, sized to sit at the end of a row. */
const SMALL_CARD = "h-8 w-6 rounded-[5px] border-2";

function VoteStatus({
  participant: p,
  revealed,
}: {
  participant: ParticipantView;
  revealed: boolean;
}) {
  if (p.role === "observer")
    return (
      <Eye aria-label="Observer" className="text-muted-foreground size-4" />
    );
  if (revealed)
    return (
      <span
        role="img"
        aria-label={p.vote === null ? "No Vote" : `Voted ${p.vote} hours`}
        className={cn(
          SMALL_CARD,
          "font-display border-ink bg-card shadow-hard-sm animate-pop grid rotate-3 place-items-center text-xs font-semibold tabular-nums",
        )}
      >
        {p.vote ?? "–"}
      </span>
    );
  if (p.hasVoted)
    return (
      <span
        role="img"
        aria-label="Voted"
        className={cn(
          SMALL_CARD,
          "border-ink shadow-hard-sm animate-pop rotate-6 bg-[repeating-linear-gradient(45deg,var(--pop-2)_0_4px,var(--secondary)_4px_6px)]",
        )}
      />
    );
  return (
    <span
      role="img"
      aria-label="Not voted yet"
      className={cn(SMALL_CARD, "border-muted-foreground/60 border-dashed")}
    />
  );
}
