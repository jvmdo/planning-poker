import { DECK, type Card } from "../shared/deck";
import { useCardFlair } from "./lib/use-card-flair";
import { PlayingCard } from "./playing-card";

/** The Deck as a fanned hand along the bottom of the Room. The Card you played sticks up. */
export function CardHand({
  myVote,
  onPlay,
}: {
  myVote: Card | null;
  onPlay: (card: Card) => void;
}) {
  const { play, flairOf } = useCardFlair();
  const middle = (DECK.length - 1) / 2;

  return (
    <section
      aria-label="Your hand. Estimate in hours; nobody sees it until the Reveal."
      className="flex h-full items-start justify-center px-6 pt-3"
    >
      {DECK.map((card, index) => {
        const offset = index - middle;
        const selected = card === myVote;
        return (
          <div
            key={card}
            // Fanned: each Card turns a little and drops towards the ends.
            style={{
              transform: `translateY(${selected ? -10 : offset * offset * 0.9}px) rotate(${offset * 2.2}deg)`,
              zIndex: selected ? 5 : undefined,
            }}
            className="-mx-[clamp(0px,0.2vw,4px)] transition-transform duration-150 hover:z-10"
          >
            <PlayingCard
              card={card}
              selected={selected}
              // A Vote this hand didn't play (one restored after a reload) gets the palette colour.
              flair={flairOf(card)}
              paletteIndex={index}
              onClick={(event) => {
                play(card, event);
                onPlay(card);
              }}
              className="aspect-[3/4] w-(--hand-card-width) text-[clamp(1.4rem,min(2.6vw,4.2vh),2.8rem)]"
            />
          </div>
        );
      })}
    </section>
  );
}
