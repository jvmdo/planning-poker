import type { ParticipantView } from "../shared/protocol";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { MARK_COLOURS, withMarkLabel, type VoteMark } from "./lib/vote-marks";

const SIZES = {
  /** Sized to sit at the end of a sidebar row. */
  small: {
    card: "h-8 w-6 rounded-[5px] border-2 text-xs",
    back: "bg-[repeating-linear-gradient(45deg,var(--pop-2)_0_4px,var(--secondary)_4px_6px)]",
    shadow: "shadow-hard-sm",
    eye: "size-4",
    ring: "ring-2 ring-offset-1",
    badge: "-top-1.5 -right-1.5 size-3.5 border text-[9px]",
  },
  /** A seat at the table; grows with the screen. */
  seat: {
    card: "aspect-[3/4] w-(--seat-card-width) rounded-[clamp(6px,0.6vw,11px)] border-[3px] text-[clamp(1rem,1.5vw,1.8rem)]",
    back: "bg-[repeating-linear-gradient(45deg,var(--pop-2)_0_6px,var(--secondary)_6px_9px)]",
    shadow: "shadow-hard",
    eye: "size-6",
    ring: "ring-4 ring-offset-2",
    badge:
      "-top-2.5 -right-2.5 size-[clamp(18px,1.5vw,26px)] border-2 text-[clamp(0.7rem,0.9vw,1rem)]",
  },
};

/**
 * A Voter's Card on the table: an empty slot until they play, face-down once they have, face-up
 * with their Vote after the Reveal. Observers show an eye instead. A revealed Card can be marked
 * as an Outlier's, with a "?" badge, or as one camp of a Split.
 */
export function VoteCard({
  participant: p,
  revealed,
  size,
  mark = null,
}: {
  participant: ParticipantView;
  revealed: boolean;
  size: keyof typeof SIZES;
  mark?: VoteMark | null;
}) {
  const s = SIZES[size];
  if (p.role === "observer")
    return (
      <Eye
        aria-label="Observer"
        className={cn("text-muted-foreground", s.eye)}
      />
    );
  if (revealed) {
    const vote = p.vote === null ? "No Vote" : `Voted ${p.vote} hours`;
    return (
      <span
        role="img"
        aria-label={withMarkLabel(vote, mark)}
        className={cn(
          s.card,
          s.shadow,
          "font-display border-ink bg-card animate-pop relative grid rotate-3 place-items-center font-semibold tabular-nums",
          mark && [
            s.ring,
            "ring-offset-background text-ink",
            MARK_COLOURS[mark].fill,
            MARK_COLOURS[mark].ring,
          ],
        )}
      >
        {p.vote ?? "–"}
        {mark === "outlier" && (
          <span
            aria-hidden
            className={cn(
              s.badge,
              "border-ink bg-card text-foreground absolute grid -rotate-3 place-items-center rounded-full font-sans leading-none font-bold",
            )}
          >
            ?
          </span>
        )}
      </span>
    );
  }
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
