import type { ParticipantId, ParticipantView } from "../shared/protocol";
import type { GhostView } from "../shared/ghost";
import { cn } from "@/lib/utils";
import { GhostFigure } from "./ghost-figure";

/**
 * Every Observer's Ghost, drawn over the room area: above the Table, below toasts. It covers the
 * room area but ignores the pointer, except on the Ghosts themselves. `tableBox` lays out an inner
 * box exactly over the Table, so a Ghost's point on the shared Table places it.
 */
export function GhostLayer({
  participants,
  tableBox,
  ghostRef,
}: {
  participants: ParticipantView[];
  /** Classes that put the inner box exactly over the Table, matching the room area's padding. */
  tableBox: string;
  /** Each Ghost's figure as it's drawn, or null once it's gone. */
  ghostRef: (id: ParticipantId, element: HTMLElement | null) => void;
}) {
  const withGhosts = participants.filter(
    (p): p is ParticipantView & { ghost: GhostView } => p.ghost !== null,
  );
  if (withGhosts.length === 0) return null;

  return (
    <div className={cn("pointer-events-none absolute inset-0 z-10", tableBox)}>
      <ul aria-label="Ghosts" className="relative h-full">
        {withGhosts.map((p) => (
          <li
            key={p.id}
            // For now every screen shows the shared Table as an Observer sees it.
            style={{
              left: `${100 * p.ghost.to.x}%`,
              top: `${100 * p.ghost.to.y}%`,
            }}
            className={cn(
              // Centred on its point by the middle of its body, with its name tag below.
              "pointer-events-auto absolute flex -translate-x-1/2 -translate-y-[23px] flex-col items-center gap-0.5",
              // Slightly see-through, so a Result under it stays readable; faded while away.
              p.connected ? "opacity-90" : "opacity-50",
            )}
          >
            <div
              ref={(element) => ghostRef(p.id, element)}
              className="animate-ghost-bob motion-reduce:animate-none"
            >
              <GhostFigure skin={p.ghost.skin} className="h-[46px] w-[42px]" />
            </div>
            <span className="bg-card border-ink font-display shadow-hard-sm max-w-28 truncate rounded-full border-2 px-1.5 text-[0.65rem] leading-tight font-semibold">
              {p.name}
              <span className="sr-only">
                's Ghost{!p.connected && ", away"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
