import {
  GRACE_PERIOD_MS,
  type ParticipantId,
  type ParticipantView,
} from "../shared/protocol";
import { Check, Clock, Crown, Eye, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

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
        className="text-muted-foreground px-5 pt-4 pb-2 text-xs font-medium tracking-wide uppercase"
      >
        Participants · {participants.length}
      </h2>
      <ul className="overflow-y-auto px-2">
        {participants.map((p) => (
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
                className="text-muted-foreground size-4 shrink-0"
              />
            ) : p.hasVoted ? (
              <Check
                aria-label="Voted"
                className="size-4 shrink-0 text-emerald-600"
              />
            ) : (
              <Clock
                aria-label="Not voted yet"
                className="text-muted-foreground size-4 shrink-0"
              />
            )}
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
            {revealed && p.role === "voter" && (
              <span
                aria-label={
                  p.vote === null ? "No Vote" : `Voted ${p.vote} hours`
                }
                className="ml-auto font-semibold tabular-nums"
              >
                {p.vote ?? "–"}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
