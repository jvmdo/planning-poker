import { DECK, type Card } from "../shared/deck";
import { popBackground } from "./lib/pop";
import { cn } from "@/lib/utils";

export function CardHand({
  myVote,
  onPlay,
}: {
  myVote: Card | null;
  onPlay: (card: Card) => void;
}) {
  return (
    <section className="max-w-4xl">
      <h2 className="font-display mb-1 text-xl font-semibold">
        Pick your Card
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Estimate in hours. Nobody sees it until the Reveal.
      </p>
      <div className="grid grid-cols-6 gap-4">
        {DECK.map((card, index) => {
          const selected = card === myVote;
          return (
            <button
              key={card}
              aria-pressed={selected}
              aria-label={`${card} hours`}
              onClick={() => onPlay(card)}
              className={cn(
                "font-display border-ink bg-card shadow-hard hover:shadow-hard-lg focus-visible:ring-ring/50 flex aspect-[3/4] flex-col items-center justify-center rounded-[1.1rem] border-[3px] text-[2.6rem] font-semibold transition-[translate,rotate,box-shadow] duration-[120ms] outline-none hover:-translate-x-0.5 hover:-translate-y-0.5 hover:-rotate-[1.5deg] focus-visible:ring-[3px] active:translate-x-[3px] active:translate-y-[3px] active:rotate-0 active:shadow-[2px_2px_0_var(--ink)]",
                selected && [popBackground(index), "text-ink animate-pop"],
              )}
            >
              {card}
              <span className="mt-1 font-sans text-xs font-normal opacity-60">
                hours
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
