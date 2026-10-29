import { DECK, type Card } from "../shared/deck";
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
      <h2 className="mb-1 text-xl font-semibold">Pick your Card</h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Estimate in hours. Nobody sees it until the Reveal.
      </p>
      <div className="grid grid-cols-6 gap-4">
        {DECK.map((card) => {
          const selected = card === myVote;
          return (
            <button
              key={card}
              aria-pressed={selected}
              aria-label={`${card} hours`}
              onClick={() => onPlay(card)}
              className={cn(
                "hover:border-foreground focus-visible:ring-ring/50 flex aspect-[3/4] flex-col items-center justify-center rounded-xl border-2 text-4xl font-semibold transition-colors outline-none focus-visible:ring-[3px]",
                selected && "bg-primary text-primary-foreground border-primary",
              )}
            >
              {card}
              <span className="mt-1 text-xs font-normal opacity-60">hours</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
