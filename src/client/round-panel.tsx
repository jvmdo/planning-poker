import type { Deck } from "../shared/deck";
import type { RoomSnapshot } from "../shared/protocol";
import { DeckDialog } from "./deck-dialog";
import { Waiting } from "./waiting";
import type { PendingCommand } from "./pending";
import { Button } from "@/components/ui/button";

/**
 * Where the Round stands, who we're waiting on, and the Facilitator's controls: Reveal, New Round
 * and the Deck.
 */
export function RoundPanel({
  snapshot,
  isFacilitator,
  onReveal,
  onNewRound,
  onSetDeck,
  pendingCommand,
}: {
  snapshot: RoomSnapshot;
  isFacilitator: boolean;
  /** Sent and not yet answered by the server: every button waits until it is. */
  pendingCommand: PendingCommand["command"] | null;
  onReveal: () => void;
  onNewRound: () => void;
  onSetDeck: (deck: Deck) => void;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const played = voters.filter((p) => p.hasVoted).length;
  const waiting = voters.filter((p) => !p.hasVoted);
  const anyVotes = played > 0;
  const progress = voters.length ? (played / voters.length) * 100 : 0;

  return (
    <div className="relative">
      <div className="flex h-20 items-center gap-4 border-b px-8">
        <div>
          <p className="font-display text-lg font-semibold">
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
              <Button
                onClick={onReveal}
                disabled={!anyVotes || pendingCommand !== null}
                aria-busy={pendingCommand === "reveal"}
              >
                {pendingCommand === "reveal" && <Waiting />}
                Reveal
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onNewRound}
              disabled={pendingCommand !== null}
              aria-busy={pendingCommand === "newRound"}
            >
              {pendingCommand === "newRound" && <Waiting />}
              New Round
            </Button>
            <DeckDialog
              deck={snapshot.deck}
              votesCast={snapshot.participants.filter((p) => p.hasVoted).length}
              disabled={pendingCommand !== null}
              busy={pendingCommand === "setDeck"}
              onApply={onSetDeck}
            />
          </div>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Voters who played"
        aria-valuemin={0}
        aria-valuemax={voters.length}
        aria-valuenow={played}
        className="bg-ink absolute inset-x-0 bottom-0 h-1"
      >
        <div
          className="bg-pop-1 h-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
