import { useState } from "react";
import { loadIdentity } from "./lib/identity";
import { JoinScreen } from "./join-screen";
import { ParticipantList } from "./participant-list";
import { useRoom } from "./use-room";

export function App() {
  const [identity] = useState(loadIdentity);
  const { connected, snapshot, me, name, joining, rejection, join } =
    useRoom(identity);

  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-semibold">Planning Poker</h1>
      {!connected && (
        <p role="status" className="text-muted-foreground text-sm">
          {snapshot ? "Reconnecting…" : "Connecting…"}
        </p>
      )}
      {me && snapshot ? (
        <ParticipantList
          participants={snapshot.participants}
          myId={identity.id}
        />
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
