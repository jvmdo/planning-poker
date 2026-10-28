import type { RoomSnapshot } from "../shared/protocol";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** The Result after the Reveal, and the Facilitator's Reveal and New Round controls. */
export function RoundPanel({
  snapshot,
  isFacilitator,
  onReveal,
  onNewRound,
}: {
  snapshot: RoomSnapshot;
  isFacilitator: boolean;
  onReveal: () => void;
  onNewRound: () => void;
}) {
  const anyVotes = snapshot.participants.some((p) => p.hasVoted);
  if (!snapshot.revealed && !isFacilitator) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3">
        {snapshot.result !== null && (
          <p className="mr-auto">
            <span className="text-muted-foreground text-sm">Result</span>{" "}
            <span className="text-3xl font-semibold">
              {snapshot.result.toFixed(1)}
            </span>{" "}
            <span className="text-muted-foreground text-sm">hours</span>
          </p>
        )}
        {isFacilitator && (
          <div className="ml-auto flex gap-2">
            {!snapshot.revealed && (
              <Button onClick={onReveal} disabled={!anyVotes}>
                Reveal
              </Button>
            )}
            <Button variant="outline" onClick={onNewRound}>
              New Round
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
