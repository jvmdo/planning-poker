import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { Logo } from "./logo";
import { loadIdentity } from "./lib/identity";
import { CardHand } from "./card-hand";
import { ClaimFacilitator } from "./claim-facilitator";
import { JoinScreen } from "./join-screen";
import { ParticipantList } from "./participant-list";
import { ResultBreakdown } from "./result-breakdown";
import { RoleToggle } from "./role-toggle";
import { RoundPanel } from "./round-panel";
import { ThemeSwitch } from "./theme-switch";
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
    becomeVoter,
    becomeObserver,
    handOver,
    claimFacilitator,
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
      <main className="mx-auto flex min-h-svh max-w-xl flex-col gap-4 px-4 py-6">
        <h1 className="font-display flex items-center gap-3 text-2xl font-semibold">
          <Logo className="size-12 shrink-0" />
          Planning Poker
        </h1>
        {alerts}
        {joining ? (
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

  return (
    <div className="grid h-svh grid-cols-[300px_1fr]">
      <aside className="bg-secondary border-ink flex min-h-0 flex-col border-r-[3px]">
        {/* Same height and rule as the status bar, so the two line up. */}
        <div className="border-ink flex h-20 shrink-0 items-center border-b-4 px-5">
          <h1 className="font-display flex items-center gap-2 text-lg font-semibold whitespace-nowrap">
            <Logo className="size-12 shrink-0" />
            Planning Poker
          </h1>
        </div>
        <ParticipantList
          participants={snapshot.participants}
          myId={identity.id}
          revealed={snapshot.revealed}
          onHandOver={me.isFacilitator ? handOver : undefined}
        />
        <div className="flex items-end justify-between gap-2 border-t p-4">
          <RoleToggle
            name={me.name}
            role={me.role}
            onBecomeVoter={becomeVoter}
            onBecomeObserver={becomeObserver}
          />
          <ThemeSwitch />
        </div>
      </aside>
      <main className="flex min-h-0 flex-col overflow-y-auto">
        <RoundPanel
          snapshot={snapshot}
          isFacilitator={me.isFacilitator}
          onReveal={reveal}
          onNewRound={newRound}
          pendingCommand={pendingCommand}
        />
        <div className="flex flex-col gap-4 p-8">
          {alerts}
          {!snapshot.hasFacilitator && (
            <ClaimFacilitator onClaim={claimFacilitator} />
          )}
          {snapshot.revealed ? (
            <ResultBreakdown
              snapshot={snapshot}
              isVoter={me.role === "voter"}
            />
          ) : me.role === "voter" ? (
            <CardHand myVote={snapshot.myVote} onPlay={vote} />
          ) : (
            <p className="text-muted-foreground">
              You're observing. The Room won't wait for your Vote.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
