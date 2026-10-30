import type { FunEvent } from "../shared/fun";
import type { ParticipantView } from "../shared/protocol";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { shake } from "./lib/fun-animations";
import { VoteCard } from "./vote-card";

/** One choice in a seat's deck: a Reaction, or something to Throw. Picking it says what was sent. */
export interface DeckItem {
  key: string;
  emoji: string;
  label: string;
  /** Null when nothing was sent, because the burst is used up. */
  onPick: () => FunEvent | null;
}

/**
 * A Voter's seat at the table: their Card and name. Hovering or clicking the Card opens a deck
 * above or below it; a click keeps it open, so it works by touch and from the keyboard.
 */
export function TableSeat({
  participant: p,
  isMe,
  revealed,
  left,
  top,
  deck,
  deckLabel,
  cardLabel,
  open,
  onToggle,
  onHover,
  onClose,
  onSent,
  cardRef,
}: {
  participant: ParticipantView;
  isMe: boolean;
  revealed: boolean;
  /** Where on the table's edge, as percentages of its box. */
  left: number;
  top: number;
  deck: DeckItem[];
  deckLabel: string;
  cardLabel: string;
  open: boolean;
  onToggle: () => void;
  onHover: () => void;
  onClose: () => void;
  /** Plays what you just sent at once, rather than waiting for the server's echo. */
  onSent: (event: FunEvent) => void;
  cardRef: (element: HTMLButtonElement | null) => void;
}) {
  const deckRef = useRef<HTMLDivElement>(null);
  // Seats in the bottom half open their deck upwards, the rest downwards.
  const deckAbove = top > 60;

  return (
    <li
      data-seat
      style={{ left: `${left}%`, top: `${top}%` }}
      onMouseEnter={onHover}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        onClose();
        (document.activeElement as HTMLElement | null)?.blur();
      }}
      className={cn(
        "group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 focus-within:z-20 hover:z-20",
        open && "z-20",
        !p.connected && "opacity-50",
      )}
    >
      <button
        ref={cardRef}
        aria-label={cardLabel}
        title={cardLabel}
        aria-expanded={open}
        onClick={onToggle}
        className="grid cursor-pointer rounded-[clamp(6px,0.6vw,11px)] transition-transform outline-none group-hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <VoteCard participant={p} revealed={revealed} size="seat" />
      </button>
      <span
        className={cn(
          "bg-card border-ink max-w-28 truncate rounded-full border-2 px-2 text-xs",
          isMe && "font-semibold",
        )}
      >
        {p.name}
        {isMe && " (you)"}
      </span>
      {/* The padding bridges the gap to the Card, so the deck stays open on the way over. */}
      <div
        className={cn(
          "absolute left-1/2 hidden -translate-x-1/2 group-focus-within:block group-hover:block",
          open && "block",
          deckAbove ? "bottom-full pb-2" : "top-full pt-2",
        )}
      >
        <div
          ref={deckRef}
          role="group"
          aria-label={deckLabel}
          className="bg-card border-ink shadow-hard animate-pop flex gap-1 rounded-2xl border-[3px] p-1.5"
        >
          {deck.map((item, i) => (
            <button
              key={item.key}
              aria-label={item.label}
              title={item.label}
              onClick={() => {
                const sent = item.onPick();
                if (sent) onSent(sent);
                else if (deckRef.current) shake(deckRef.current);
              }}
              // The deck fans out a little, like the hand.
              style={{ rotate: `${(i - (deck.length - 1) / 2) * 4}deg` }}
              className="hover:bg-muted focus-visible:ring-ring/50 grid size-10 place-items-center rounded-xl text-2xl transition-transform outline-none hover:-translate-y-1 hover:scale-125 focus-visible:ring-[3px]"
            >
              {item.emoji}
            </button>
          ))}
        </div>
      </div>
    </li>
  );
}
