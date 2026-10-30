import type { Card, Deck } from "../shared/deck";
import { useCardFlair } from "./lib/use-card-flair";
import { PlayingCard } from "./playing-card";
import { cn } from "@/lib/utils";

/**
 * The Deck as a fanned hand along the bottom of the Room. The Card you played sticks up. The
 * Cards' size and fan come from `.card-hand` in `index.css`, so they fit any Deck.
 */
export function CardHand({
  deck,
  myVote,
  onPlay,
  className,
}: {
  deck: Deck;
  myVote: Card | null;
  onPlay: (card: Card) => void;
  className?: string;
}) {
  const { play, flairOf } = useCardFlair();

  return (
    <section
      aria-label="Your hand. Estimate in hours; nobody sees it until the Reveal."
      className={cn(
        "card-hand flex h-full items-start justify-center px-6 pt-3",
        className,
      )}
    >
      {deck.map((card, index) => (
        <div
          key={card}
          data-selected={card === myVote || undefined}
          className="-mx-[clamp(0px,0.2vw,4px)] transition-[translate,rotate] duration-150 hover:z-10"
        >
          <PlayingCard
            card={card}
            selected={card === myVote}
            // A Vote this hand didn't play (one restored after a reload) gets the palette colour.
            flair={flairOf(card)}
            paletteIndex={index}
            onClick={(event) => {
              play(card, event);
              onPlay(card);
            }}
            className="aspect-[3/4] w-full text-[clamp(1.2rem,40cqi,2.8rem)]"
          />
        </div>
      ))}
    </section>
  );
}
