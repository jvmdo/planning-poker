import type { RoomSnapshot } from "../shared/protocol";
import { Button } from "@/components/ui/button";

/** Where the Round stands, who we're waiting on, and the Facilitator's Reveal and New Round controls. */
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
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const played = voters.filter((p) => p.hasVoted).length;
  const waiting = voters.filter((p) => !p.hasVoted);
  const anyVotes = played > 0;
  const progress = voters.length ? (played / voters.length) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-4 border-b px-8 py-4">
        <div>
          <p className="text-lg font-semibold">
            {snapshot.revealed ? "Votes revealed" : "Voting"}
          </p>
          <p className="text-muted-foreground text-sm">
            {played} of {voters.length} Voters played
            {!snapshot.revealed && waiting.length > 0 && (
              <> · waiting on {waiting.map((p) => p.name).join(", ")}</>
            )}
          </p>
        </div>
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
      </div>
      <div
        role="progressbar"
        aria-label="Voters who played"
        aria-valuemin={0}
        aria-valuemax={voters.length}
        aria-valuenow={played}
        className="bg-muted h-1"
      >
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
