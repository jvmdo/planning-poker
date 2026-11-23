import { Copy, Ghost, LoaderCircle } from "lucide-react";
import type { Deck } from "../shared/deck";
import type { RoomId, RoomSnapshot } from "../shared/protocol";
import { shortRoomId } from "./lib/page-room";
import { RoomSettings } from "./room-settings";
import { Waiting } from "./waiting";
import type { PendingCommand } from "./pending";
import { Button } from "@/components/ui/button";

const RECONNECTING = "Reconnecting… you'll rejoin automatically.";
const FACILITATOR_LEFT = "The Facilitator left and the Round was discarded.";
/** Longer Room IDs are cut short, so the status bar never pushes the Facilitator's controls. */
const ROOM_ID_SHOWN = 16;

/**
 * The Room ID with a button that copies its Share link, where the Round stands, who we're waiting
 * on, the Room settings for everyone, and the Facilitator's New Round while voting (the Table has
 * Reveal, and New Round after the Reveal). While the Room has no
 * Facilitator it says so, and offers everyone "Become Facilitator" where those controls would be:
 * the first click wins. An Observer also gets a button to bring out their Ghost or put it away,
 * left of those controls. While the connection is down it says so instead, and the buttons wait for
 * the Room's snapshot after rejoining, since nothing they send would arrive.
 */
export function RoundPanel({
  roomId,
  onCopyLink,
  snapshot,
  isFacilitator,
  reconnecting,
  onNewRound,
  onSetDeck,
  onSetAutoReveal,
  onClaimFacilitator,
  ghost,
  pendingCommand,
}: {
  roomId: RoomId;
  onCopyLink: () => void;
  snapshot: RoomSnapshot;
  isFacilitator: boolean;
  /** Lost the connection, and not back in the Room yet. */
  reconnecting: boolean;
  /** Sent and not yet answered by the server: every button waits until it is. */
  pendingCommand: PendingCommand["command"] | null;
  onNewRound: () => void;
  onSetDeck: (deck: Deck) => void;
  onSetAutoReveal: (on: boolean) => void;
  onClaimFacilitator: () => void;
  /** Your Ghost's button, only for an Observer. */
  ghost: { out: boolean; onSummon: () => void; onDismiss: () => void } | null;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const played = voters.filter((p) => p.hasVoted).length;
  const showClaim = !snapshot.hasFacilitator;
  const showNewRound = isFacilitator && !snapshot.revealed;
  const waiting = voters.filter((p) => !p.hasVoted);
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
        <div className="min-w-0">
          <p className="font-display flex items-center text-lg font-semibold whitespace-nowrap">
            <span title={roomId}>{shortRoomId(roomId, ROOM_ID_SHOWN)}</span>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Copy Share link"
              title="Copy Share link"
              onClick={onCopyLink}
              className="text-muted-foreground mx-1 size-8 px-0"
            >
              <Copy aria-hidden className="size-4" />
            </Button>
            <span aria-hidden className="text-muted-foreground mr-1">
              ·
            </span>
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
        {/* The Round's actions sit together; the gear stands apart from them. */}
        <div className="ml-auto flex items-center gap-4">
          {(ghost || showClaim || showNewRound) && (
            <div className="flex items-center gap-2">
              {ghost && (
                <Button
                  variant={ghost.out ? "default" : "outline"}
                  aria-pressed={ghost.out}
                  title={
                    ghost.out ? "Put your Ghost away" : "Bring out your Ghost"
                  }
                  onClick={ghost.out ? ghost.onDismiss : ghost.onSummon}
                  disabled={reconnecting}
                >
                  <Ghost aria-hidden className="size-4" />
                  {/* Only the icon on narrow screens, so the status bar still fits. */}
                  <span className="max-md:sr-only">Ghost</span>
                </Button>
              )}
              {showClaim && (
                <Button
                  onClick={onClaimFacilitator}
                  disabled={locked}
                  aria-busy={pendingCommand === "claimFacilitator"}
                >
                  {pendingCommand === "claimFacilitator" && <Waiting />}
                  Become Facilitator
                </Button>
              )}
              {showNewRound && (
                <Button
                  variant="outline"
                  onClick={onNewRound}
                  disabled={locked}
                  aria-busy={pendingCommand === "newRound"}
                >
                  {pendingCommand === "newRound" && <Waiting />}
                  New Round
                </Button>
              )}
            </div>
          )}
          <RoomSettings
            snapshot={snapshot}
            isFacilitator={isFacilitator}
            locked={locked}
            pendingCommand={pendingCommand}
            onSetAutoReveal={onSetAutoReveal}
            onSetDeck={onSetDeck}
          />
        </div>
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
