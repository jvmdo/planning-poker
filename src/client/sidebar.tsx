import type {
  ParticipantId,
  ParticipantView,
  RoomSnapshot,
} from "../shared/protocol";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ParticipantList } from "./participant-list";
import { RoleToggle } from "./role-toggle";
import { ThemeSwitch } from "./theme-switch";
import { VoteCard } from "./vote-card";

/** Below this window width the sidebar starts collapsed, to leave the table room. */
const COLLAPSE_BELOW_PX = 1280;

/**
 * Who's in the Room, your role, Leave and the theme. Collapsed, it keeps only the logo, each
 * Voter's Card (names on hover) and the role switch as icons.
 */
export function Sidebar({
  snapshot,
  me,
  myId,
  onHandOver,
  onBecomeVoter,
  onBecomeObserver,
  onLeave,
}: {
  snapshot: RoomSnapshot;
  me: ParticipantView;
  myId: ParticipantId;
  /** Only given to the Facilitator. */
  onHandOver?: (to: ParticipantId) => void;
  onBecomeVoter: () => void;
  onBecomeObserver: () => void;
  onLeave: () => void;
}) {
  const [collapsed, setCollapsed] = useState(
    () => window.innerWidth < COLLAPSE_BELOW_PX,
  );
  const toggleLabel = collapsed ? "Expand the sidebar" : "Collapse the sidebar";
  const toggle = (
    <button
      aria-label={toggleLabel}
      title={toggleLabel}
      aria-expanded={!collapsed}
      onClick={() => setCollapsed((c) => !c)}
      className="text-muted-foreground hover:text-foreground rounded-md p-1"
    >
      {collapsed ? (
        <PanelLeftOpen aria-hidden className="size-4" />
      ) : (
        <PanelLeftClose aria-hidden className="size-4" />
      )}
    </button>
  );
  const roleToggle = (
    <RoleToggle
      name={me.name}
      role={me.role}
      onBecomeVoter={onBecomeVoter}
      onBecomeObserver={onBecomeObserver}
      compact={collapsed}
    />
  );

  return (
    <aside
      className={cn(
        "bg-secondary border-ink flex min-h-0 shrink-0 flex-col border-r-[3px]",
        collapsed ? "w-[72px] items-center" : "w-[300px]",
      )}
    >
      {/* Same height and rule as the status bar, so the two line up. */}
      <div
        className={cn(
          "border-ink flex h-20 w-full shrink-0 items-center border-b-4",
          collapsed ? "justify-center" : "px-5",
        )}
      >
        {collapsed ? (
          <h1>
            <Logo className="size-11" />
            <span className="sr-only">Planning Poker</span>
          </h1>
        ) : (
          <>
            <h1 className="font-display flex items-center gap-2 text-lg font-semibold whitespace-nowrap">
              <Logo className="size-12 shrink-0" />
              Planning Poker
            </h1>
            <span className="ml-auto">{toggle}</span>
          </>
        )}
      </div>
      {collapsed ? (
        <>
          <CollapsedVoters snapshot={snapshot} myId={myId} />
          <div className="flex w-full flex-col items-center gap-3 border-t py-4">
            {roleToggle}
            {toggle}
          </div>
        </>
      ) : (
        <>
          <ParticipantList
            participants={snapshot.participants}
            myId={myId}
            revealed={snapshot.revealed}
            onHandOver={onHandOver}
          />
          <div className="flex items-end justify-between gap-2 border-t p-4">
            {roleToggle}
            {/* The theme switch sets the width; Leave stretches to match it. */}
            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7.5 gap-1.5 px-0"
                onClick={onLeave}
              >
                <LogOut aria-hidden className="size-4" />
                Leave
              </Button>
              <ThemeSwitch />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

/** Each Voter's Card, without names; the name shows on hover and is read by screen readers. */
function CollapsedVoters({
  snapshot,
  myId,
}: {
  snapshot: RoomSnapshot;
  myId: ParticipantId;
}) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  return (
    <ul
      aria-label="Voters"
      className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto py-3"
    >
      {voters.map((p) => {
        const name = p.id === myId ? `${p.name} (you)` : p.name;
        return (
          <li
            key={p.id}
            title={name}
            className={cn(
              "grid size-10 shrink-0 place-items-center rounded-lg",
              p.id === myId && "bg-background",
              !p.connected && "opacity-50",
            )}
          >
            <span className="sr-only">{name}</span>
            <VoteCard
              participant={p}
              revealed={snapshot.revealed}
              size="small"
            />
          </li>
        );
      })}
    </ul>
  );
}
