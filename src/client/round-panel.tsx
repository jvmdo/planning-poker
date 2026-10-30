import { LoaderCircle } from "lucide-react";
import type { Deck } from "../shared/deck";
import type { RoomSnapshot } from "../shared/protocol";
import { DeckDialog } from "./deck-dialog";
import { Waiting } from "./waiting";
import type { PendingCommand } from "./pending";
import { Button } from "@/components/ui/button";

const RECONNECTING = "Reconnecting… you'll rejoin automatically.";
const FACILITATOR_LEFT = "The Facilitator left and the Round was discarded.";

/**
 * Where the Round stands, who we're waiting on, and the Facilitator's controls: Reveal, New Round
 * and the Deck. While the Room has no Facilitator it says so, and offers everyone "Become
 * Facilitator" where those controls would be: the first click wins. While the connection is down it
 * says so instead, and the buttons wait for the Room's snapshot after rejoining, since nothing they
 * send would arrive.
 */
export function RoundPanel({
  snapshot,
  isFacilitator,
  reconnecting,
  onReveal,
  onNewRound,
  onSetDeck,
  onClaimFacilitator,
  pendingCommand,
}: {
  snapshot: RoomSnapshot;
  isFacilitator: boolean;
  /** Lost the connection, and not back in the Room yet. */
  reconnecting: boolean;
  /** Sent and not yet answered by the server: every button waits until it is. */
  pendingCommand: PendingCommand["command"] | null;
  onReveal: () => void;
  onNewRound: () => void;
  onSetDeck: (deck: Deck) => void;
  onClaimFacilitator: () => void;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const played = voters.filter((p) => p.hasVoted).length;
  const waiting = voters.filter((p) => !p.hasVoted);
  const anyVotes = played > 0;
  const progress = voters.length ? (played / voters.length) * 100 : 0;
  const locked = reconnecting || pendingCommand !== null;
  const status = reconnecting
    ? RECONNECTING
    : !snapshot.hasFacilitator
      ? FACILITATOR_LEFT
      : null;

  return (
    <div className="relative">
      <div className="flex h-20 items-center gap-4 border-b px-8">
        <div>
          <p className="font-display text-lg font-semibold">
            {snapshot.revealed ? "Votes revealed" : "Voting"}
          </p>
          {status ? (
            <p
              aria-hidden
              className="text-muted-foreground flex items-center gap-1.5 text-sm"
            >
              {reconnecting && (
                <LoaderCircle className="size-4 shrink-0 animate-spin" />
              )}
              {status}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {played} of {voters.length} Voters played
              {!snapshot.revealed && waiting.length > 0 && (
                <> · waiting on {waiting.map((p) => p.name).join(", ")}</>
              )}
            </p>
          )}
          {/* Always mounted, so screen readers hear the message when it fills. */}
          <p role="status" className="sr-only">
            {status}
          </p>
        </div>
        {!snapshot.hasFacilitator && (
          <Button
            className="ml-auto"
            onClick={onClaimFacilitator}
            disabled={locked}
            aria-busy={pendingCommand === "claimFacilitator"}
          >
            {pendingCommand === "claimFacilitator" && <Waiting />}
            Become Facilitator
          </Button>
        )}
        {isFacilitator && (
          <div className="ml-auto flex gap-2">
            {!snapshot.revealed && (
              <Button
                onClick={onReveal}
                disabled={!anyVotes || locked}
                aria-busy={pendingCommand === "reveal"}
              >
                {pendingCommand === "reveal" && <Waiting />}
                Reveal
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onNewRound}
              disabled={locked}
              aria-busy={pendingCommand === "newRound"}
            >
              {pendingCommand === "newRound" && <Waiting />}
              New Round
            </Button>
            <DeckDialog
              deck={snapshot.deck}
              votesCast={snapshot.participants.filter((p) => p.hasVoted).length}
              disabled={locked}
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
