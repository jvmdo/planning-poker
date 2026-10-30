import type { ParticipantView } from "../shared/protocol";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  /** Sized to sit at the end of a sidebar row. */
  small: {
    card: "h-8 w-6 rounded-[5px] border-2 text-xs",
    back: "bg-[repeating-linear-gradient(45deg,var(--pop-2)_0_4px,var(--secondary)_4px_6px)]",
    shadow: "shadow-hard-sm",
    eye: "size-4",
  },
  /** A seat at the table; grows with the screen. */
  seat: {
    card: "aspect-[3/4] w-[clamp(40px,3.4vw,68px)] rounded-[clamp(6px,0.6vw,11px)] border-[3px] text-[clamp(1rem,1.5vw,1.8rem)]",
    back: "bg-[repeating-linear-gradient(45deg,var(--pop-2)_0_6px,var(--secondary)_6px_9px)]",
    shadow: "shadow-hard",
    eye: "size-6",
  },
};

/**
 * A Voter's Card on the table: an empty slot until they play, face-down once they have, face-up
 * with their Vote after the Reveal. Observers show an eye instead.
 */
export function VoteCard({
  participant: p,
  revealed,
  size,
}: {
  participant: ParticipantView;
  revealed: boolean;
  size: keyof typeof SIZES;
}) {
  const s = SIZES[size];
  if (p.role === "observer")
    return (
      <Eye
        aria-label="Observer"
        className={cn("text-muted-foreground", s.eye)}
      />
    );
  if (revealed)
    return (
      <span
        role="img"
        aria-label={p.vote === null ? "No Vote" : `Voted ${p.vote} hours`}
        className={cn(
          s.card,
          s.shadow,
          "font-display border-ink bg-card animate-pop grid rotate-3 place-items-center font-semibold tabular-nums",
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
          s.card,
          s.back,
          s.shadow,
          "border-ink animate-pop rotate-6",
        )}
      />
    );
  return (
    <span
      role="img"
      aria-label="Not voted yet"
      className={cn(s.card, "border-muted-foreground/60 border-dashed")}
    />
  );
}
