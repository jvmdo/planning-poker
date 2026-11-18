import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import type { RoomId } from "../shared/protocol";
import { randomRoomId } from "../shared/room-id";
import { CardHand } from "./card-hand";
import { JoinScreen } from "./join-screen";
import { loadIdentity } from "./lib/identity";
import { showInAddressBar } from "./lib/page-room";
import { NoticeToast } from "./notice-toast";
import { ResultBreakdown } from "./result-breakdown";
import { RoomTable } from "./room-table";
import { RoundPanel } from "./round-panel";
import { Sidebar } from "./sidebar";
import { useRoom } from "./use-room";

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

  function createRoom(nameToJoinWith: string) {
    const newRoomId = randomRoomId();
    showInAddressBar(newRoomId);
    setRoomId(newRoomId);
    join(nameToJoinWith);
  }

  /** At `/`, nothing connects until a Room is created. */
  const connecting = roomId !== null && !connected;

  if (!me || !snapshot)
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
        me={me}
        myId={identity.id}
        onHandOver={me.isFacilitator ? handOver : undefined}
        onBecomeVoter={becomeVoter}
        onBecomeObserver={becomeObserver}
        onLeave={leave}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <RoundPanel
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
            myId={identity.id}
            onReact={react}
            onThrow={throwAt}
          />
          <NoticeToast notice={notice} />
        </div>
        {/* The hand and the breakdown share a height, so the table stays put at the Reveal. */}
        <div className="h-(--hand-height) shrink-0">
          {snapshot.revealed ? (
            <ResultBreakdown snapshot={snapshot} />
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
