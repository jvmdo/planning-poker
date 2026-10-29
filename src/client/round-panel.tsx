import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import type { RoomSnapshot } from "../shared/protocol";
import type { PendingCommand } from "./pending";
import { Button } from "@/components/ui/button";

/** Where the Round stands, who we're waiting on, and the Facilitator's Reveal and New Round controls. */
export function RoundPanel({
  snapshot,
  isFacilitator,
  onReveal,
  onNewRound,
  pendingCommand,
}: {
  snapshot: RoomSnapshot;
  isFacilitator: boolean;
  /** Sent and not yet answered by the server: both buttons wait until it is. */
  pendingCommand: PendingCommand["command"] | null;
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

/** Appears only if the server takes noticeably long, so quick answers don't flicker. */
function Waiting(): ReactNode {
  return (
    <LoaderCircle
      aria-hidden
      className="size-4 opacity-0 [animation:spin_1s_linear_infinite,appear_0s_150ms_forwards]"
    />
  );
}
