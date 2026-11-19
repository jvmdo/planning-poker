import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { RoomId } from "../shared/protocol";
import { randomRoomId } from "../shared/room-id";
import { CardHand } from "./card-hand";
import { JoinScreen } from "./join-screen";
import { loadIdentity } from "./lib/identity";
import { shareLinkOf, shortRoomId, showInAddressBar } from "./lib/page-room";
import { NoticeToast } from "./notice-toast";
import { useRoundReading } from "./lib/vote-marks";
import { ResultBreakdown } from "./result-breakdown";
import { RoomTable } from "./room-table";
import { RoundPanel } from "./round-panel";
import { Sidebar } from "./sidebar";
import { useRoom } from "./use-room";

/** Longer Room IDs are cut short in the tab title. */
const ROOM_ID_IN_TITLE = 24;
/** Long enough to copy the Share link by hand. */
const COPY_BY_HAND_MS = 12000;

/**
 * The page of the Room `startRoomId`, which it rejoins without the join screen when `rejoin` is
 * set. When `startRoomId` is null, the join screen offers to create a Room, and the page becomes
 * that Room's.
 */
export function App({
  startRoomId,
  rejoin,
}: {
  startRoomId: RoomId | null;
  rejoin: boolean;
}) {
  const [identity] = useState(loadIdentity);
  const [roomId, setRoomId] = useState(startRoomId);
  const {
    connected,
    reconnecting,
    snapshot,
    notice,
    showNotice,
    pendingCommand,
    me,
    name,
    joining,
    rejection,
    join,
    vote,
    reveal,
    newRound,
    setDeck,
    becomeVoter,
    becomeObserver,
    handOver,
    claimFacilitator,
    leave,
    react,
    throwAt,
  } = useRoom(identity, roomId, rejoin);
  // How the revealed Votes came out, read at the Reveal for the Table, the sidebar and the breakdown.
  const round = useRoundReading(snapshot);

  // The tab title names the Room, on the join screen too, so two open tabs are easy to tell apart.
  useEffect(() => {
    document.title = roomId
      ? `${shortRoomId(roomId, ROOM_ID_IN_TITLE)} · Planning Poker`
      : "Planning Poker";
  }, [roomId]);

  /** The clipboard needs a secure origin, so plain-HTTP LAN access gets the link to copy by hand. */
  async function copyShareLink(roomIdToShare: RoomId) {
    const link = shareLinkOf(roomIdToShare);
    try {
      await navigator.clipboard.writeText(link);
      showNotice("Link copied");
    } catch {
      showNotice(
        `Couldn't copy the link. Copy it from the address bar: ${link}`,
        COPY_BY_HAND_MS,
      );
    }
  }

  function createRoom(nameToJoinWith: string) {
    const newRoomId = randomRoomId();
    showInAddressBar(newRoomId);
    setRoomId(newRoomId);
    join(nameToJoinWith);
  }

  /** At `/`, nothing connects until a Room is created. */
  const connecting = roomId !== null && !connected;

  if (!me || !snapshot || roomId === null)
    return (
      <JoinScreen
        roomId={roomId}
        initialName={name}
        rejection={rejection}
        disabled={connecting}
        joining={joining}
        alerts={
          connecting && (
            <p
              role="status"
              className="bg-muted text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm"
            >
              <LoaderCircle
                aria-hidden
                className="size-4 shrink-0 animate-spin"
              />
              Connecting… if the server was asleep, this can take up to a
              minute.
            </p>
          )
        }
        onJoin={roomId === null ? createRoom : join}
      />
    );

  return (
    <div className="flex h-svh">
      <Sidebar
        snapshot={snapshot}
        round={round}
        me={me}
        myId={identity.id}
        onHandOver={me.isFacilitator ? handOver : undefined}
        onBecomeVoter={becomeVoter}
        onBecomeObserver={becomeObserver}
        onLeave={leave}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <RoundPanel
          roomId={roomId}
          onCopyLink={() => void copyShareLink(roomId)}
          snapshot={snapshot}
          isFacilitator={me.isFacilitator}
          reconnecting={reconnecting}
          onReveal={reveal}
          onNewRound={newRound}
          onSetDeck={setDeck}
          onClaimFacilitator={claimFacilitator}
          pendingCommand={pendingCommand}
        />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <RoomTable
            snapshot={snapshot}
            round={round}
            myId={identity.id}
            onReact={react}
            onThrow={throwAt}
          />
          <NoticeToast notice={notice} />
        </div>
        {/* The hand and the breakdown share a height, so the table stays put at the Reveal. */}
        <div className="h-(--hand-height) shrink-0">
          {snapshot.revealed ? (
            <ResultBreakdown
              snapshot={snapshot}
              round={round}
              myId={identity.id}
            />
          ) : me.role === "voter" ? (
            <CardHand
              deck={snapshot.deck}
              myVote={snapshot.myVote}
              onPlay={vote}
            />
          ) : (
            <p className="text-muted-foreground grid h-full place-items-center text-sm">
              You're observing. The Room won't wait for your Vote.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
