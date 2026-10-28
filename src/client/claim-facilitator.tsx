import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Shown to everyone while the Room has no Facilitator; the first click wins. */
export function ClaimFacilitator({ onClaim }: { onClaim: () => void }) {
  return (
    <Card className="border-primary">
      <CardContent className="flex flex-wrap items-center gap-3">
        <p className="mr-auto text-sm">
          The Facilitator has left, and the Round was discarded. Anyone can take
          over.
        </p>
        <Button onClick={onClaim}>Become Facilitator</Button>
      </CardContent>
    </Card>
  );
}
