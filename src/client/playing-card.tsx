import type { CSSProperties, MouseEvent } from "react";
import type { Card } from "../shared/deck";
import { flairBackground, popBackground, type CardFlair } from "./lib/pop";
import { cn } from "@/lib/utils";

/** One Card of the Deck, as a button. Its size comes from the caller. */
export function PlayingCard({
  card,
  selected,
  flair,
  paletteIndex,
  onClick,
  showUnit = true,
  className,
}: {
  card: Card;
  selected: boolean;
  /** The colour and tilt it was played with; without one, a selected Card takes a palette colour. */
  flair: CardFlair | null;
  paletteIndex: number;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Small Cards drop the "hours" label and keep only the number. */
  showUnit?: boolean;
  className?: string;
}) {
  const shownFlair = selected ? flair : null;
  const style: CSSProperties | undefined = shownFlair
    ? {
        background: flairBackground(shownFlair),
        rotate: `${shownFlair.tiltDeg}deg`,
      }
    : undefined;

  return (
    <button
      aria-pressed={selected}
      aria-label={`${card} hours`}
      onClick={onClick}
      style={style}
      className={cn(
        "font-display border-ink bg-card shadow-hard hover:shadow-hard-lg focus-visible:ring-ring/50 flex flex-col items-center justify-center rounded-[1.1rem] border-[3px] font-semibold transition-[translate,rotate,box-shadow] duration-[120ms] outline-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:-rotate-[1.5deg] focus-visible:ring-[3px] active:translate-x-[3px] active:translate-y-[3px] active:rotate-0 active:shadow-[2px_2px_0_var(--ink)]",
        selected && "text-ink",
        selected && !shownFlair && popBackground(paletteIndex),
        className,
      )}
    >
      {card}
      {showUnit && (
        <span className="mt-1 font-sans text-xs font-normal opacity-60">
          hours
        </span>
      )}
    </button>
  );
}
