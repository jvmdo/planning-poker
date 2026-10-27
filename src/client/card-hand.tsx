import { DECK, type Card } from "../shared/deck";
import { Button } from "@/components/ui/button";
import {
  Card as Panel,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CardHand({
  myVote,
  onPlay,
}: {
  myVote: Card | null;
  onPlay: (card: Card) => void;
}) {
  return (
    <Panel>
      <CardHeader>
        <CardTitle>Your Card</CardTitle>
        <CardDescription>
          Estimate in hours. Nobody sees it until the Reveal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {DECK.map((card) => (
            <Button
              key={card}
              variant={card === myVote ? "default" : "outline"}
              aria-pressed={card === myVote}
              aria-label={`${card} hours`}
              className="h-16 text-lg font-semibold"
              onClick={() => onPlay(card)}
            >
              {card}
            </Button>
          ))}
        </div>
      </CardContent>
    </Panel>
  );
}
