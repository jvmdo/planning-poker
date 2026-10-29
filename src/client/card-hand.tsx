import { DECK, type Card } from "../shared/deck";
import { useCardFlair } from "./lib/use-card-flair";
import { PlayingCard } from "./playing-card";

export function CardHand({
  myVote,
  onPlay,
}: {
  myVote: Card | null;
  onPlay: (card: Card) => void;
}) {
  const { play, flairOf } = useCardFlair();

  return (
    <section className="max-w-4xl">
      <h2 className="font-display mb-1 text-xl font-semibold">
        Pick your Card
      </h2>
      <p className="text-muted-foreground mb-6 text-sm">
        Estimate in hours. Nobody sees it until the Reveal.
      </p>
      <div className="grid grid-cols-6 gap-4">
        {DECK.map((card, index) => (
          <PlayingCard
            key={card}
            card={card}
            selected={card === myVote}
            // A Vote this hand didn't play (one restored after a reload) gets the palette colour.
            flair={flairOf(card)}
            paletteIndex={index}
            onClick={(event) => {
              play(card, event);
              onPlay(card);
            }}
            className="aspect-[3/4] text-[2.6rem]"
          />
        ))}
      </div>
    </section>
  );
}
