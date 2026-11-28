import type { FunEvent } from "../shared/fun";
import { useRef } from "react";
import { shake } from "./lib/fun-animations";

/** One choice in a menu: a Reaction, or something to Throw. Picking it says what was sent. */
export interface FunItem {
  key: string;
  emoji: string;
  label: string;
  /** Null when nothing was sent, because the burst is used up. */
  onPick: () => FunEvent | null;
}

/**
 * A fanned-out row of Reactions or things to Throw, as a Card or a Ghost opens it. It shakes when
 * a pick isn't sent because the burst is used up.
 */
export function FunMenu({
  items,
  label,
  onSent,
}: {
  items: FunItem[];
  label: string;
  /** Plays what you just sent at once, rather than waiting for the server's echo. */
  onSent: (event: FunEvent) => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={menuRef}
      role="group"
      aria-label={label}
      className="bg-card border-ink shadow-hard animate-pop flex gap-1 rounded-2xl border-[3px] p-1.5"
    >
      {items.map((item, i) => (
        <button
          key={item.key}
          aria-label={item.label}
          title={item.label}
          onClick={() => {
            const sent = item.onPick();
            if (sent) onSent(sent);
            else if (menuRef.current) shake(menuRef.current);
          }}
          // The menu fans out a little, like the hand.
          style={{ rotate: `${(i - (items.length - 1) / 2) * 4}deg` }}
          className="hover:bg-muted focus-visible:ring-ring/50 grid size-10 place-items-center rounded-xl text-2xl transition-transform outline-none hover:-translate-y-1 hover:scale-125 focus-visible:ring-[3px]"
        >
          {item.emoji}
        </button>
      ))}
    </div>
  );
}
