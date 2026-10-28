import { useState } from "react";
import { loadIdentity } from "./lib/identity";
import { CardHand } from "./card-hand";
import { JoinScreen } from "./join-screen";
import { ParticipantList } from "./participant-list";
import { RoleToggle } from "./role-toggle";
import { RoundPanel } from "./round-panel";
import { useRoom } from "./use-room";

export function App() {
  const [identity] = useState(loadIdentity);
  const {
    connected,
    snapshot,
    me,
    name,
    joining,
    rejection,
    join,
    vote,
    reveal,
    newRound,
    becomeVoter,
    becomeObserver,
    handOver,
  } = useRoom(identity);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Planning Poker</h1>
      {!connected && (
        <p role="status" className="text-muted-foreground text-sm">
          {snapshot ? "Reconnecting…" : "Connecting…"}
        </p>
      )}
      {me && snapshot ? (
        <>
          <RoundPanel
            snapshot={snapshot}
            isFacilitator={me.isFacilitator}
            onReveal={reveal}
            onNewRound={newRound}
          />
          <RoleToggle
            role={me.role}
            onBecomeVoter={becomeVoter}
            onBecomeObserver={becomeObserver}
          />
          {me.role === "voter" && (
            <CardHand
              myVote={snapshot.myVote}
              locked={snapshot.revealed}
              onPlay={vote}
            />
          )}
          <ParticipantList
            participants={snapshot.participants}
            myId={identity.id}
            revealed={snapshot.revealed}
            onHandOver={me.isFacilitator ? handOver : undefined}
          />
        </>
      ) : joining ? (
        connected && <p className="text-muted-foreground text-sm">Joining…</p>
      ) : (
        <JoinScreen
          initialName={name}
          rejection={rejection}
          disabled={!connected}
          onJoin={join}
        />
      )}
    </main>
  );
}
