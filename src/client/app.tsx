import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { CardHand } from "./card-hand";
import { ClaimFacilitator } from "./claim-facilitator";
import { JoinScreen } from "./join-screen";
import { loadIdentity } from "./lib/identity";
import { ResultBreakdown } from "./result-breakdown";
import { RoomTable } from "./room-table";
import { RoundPanel } from "./round-panel";
import { Sidebar } from "./sidebar";
import { useRoom } from "./use-room";

export function App() {
  const [identity] = useState(loadIdentity);
  const {
    connected,
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
  } = useRoom(identity);

  const alerts = (
    <>
      {!connected && (
        <p
          role="status"
          className="bg-muted text-muted-foreground flex items-center gap-2 rounded-md px-3 py-2 text-sm"
        >
          <LoaderCircle aria-hidden className="size-4 shrink-0 animate-spin" />
          {snapshot
            ? "Reconnecting… you'll rejoin automatically."
            : "Connecting… if the server was asleep, this can take up to a minute."}
        </p>
      )}
      {notice && (
        <p role="alert" className="bg-muted rounded-md px-3 py-2 text-sm">
          {notice}
        </p>
      )}
    </>
  );

  if (!me || !snapshot)
    return (
      <JoinScreen
        initialName={name}
        rejection={rejection}
        disabled={!connected}
        joining={joining}
        alerts={alerts}
        onJoin={join}
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
          onReveal={reveal}
          onNewRound={newRound}
          onSetDeck={setDeck}
          pendingCommand={pendingCommand}
        />
        <div className="flex flex-col gap-3 px-8 pt-3 empty:hidden">
          {alerts}
          {!snapshot.hasFacilitator && (
            <ClaimFacilitator onClaim={claimFacilitator} />
          )}
        </div>
        <RoomTable
          snapshot={snapshot}
          myId={identity.id}
          onReact={react}
          onThrow={throwAt}
        />
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
