import { useState, type MouseEvent } from "react";
import type { Card } from "../../shared/deck";
import { flick, randomFlair, type CardFlair } from "./pop";

/**
 * Remembers the colour and tilt of the last Card played and flicks each Card as it's played. Kept
 * in state, not computed while rendering: snapshots re-render the hand all the time, and the
 * colour must only change when you click.
 */
export function useCardFlair() {
  const [played, setPlayed] = useState<{
    card: Card;
    flair: CardFlair;
  } | null>(null);

  function play(card: Card, event: MouseEvent<HTMLElement>) {
    setPlayed((last) => ({ card, flair: randomFlair(last?.flair ?? null) }));
    flick(event.currentTarget);
  }

  function flairOf(card: Card) {
    return played?.card === card ? played.flair : null;
  }

  return { play, flairOf };
}
