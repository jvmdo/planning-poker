import type { ParticipantRole } from "../shared/protocol";
import { Eye, Vote } from "lucide-react";
import { cn } from "@/lib/utils";

const ROLES = [
  { role: "voter", label: "Voter", Icon: Vote },
  { role: "observer", label: "Observer", Icon: Eye },
] as const;

/** Switch between Voter and Observer. Compact: icons only, stacked, for the collapsed sidebar. */
export function RoleToggle({
  name,
  role,
  onBecomeVoter,
  onBecomeObserver,
  compact = false,
}: {
  name: string;
  role: ParticipantRole;
  onBecomeVoter: () => void;
  onBecomeObserver: () => void;
  compact?: boolean;
}) {
  const toggle = (
    <div
      role="group"
      aria-label="Your role"
      className={cn(
        "bg-card border-ink shadow-hard-sm inline-flex self-start rounded-full border-2 p-[3px]",
        compact && "flex-col self-center",
      )}
    >
      {ROLES.map(({ role: r, label, Icon }) => (
        <button
          key={r}
          aria-pressed={role === r}
          aria-label={compact ? label : undefined}
          title={compact ? label : undefined}
          onClick={
            role === r
              ? undefined
              : r === "voter"
                ? onBecomeVoter
                : onBecomeObserver
          }
          className={cn(
            "rounded-full text-sm font-bold",
            compact ? "p-1.5" : "px-3 py-1",
            role === r
              ? "bg-foreground text-background"
              : "text-foreground hover:bg-muted",
          )}
        >
          {compact ? <Icon aria-hidden className="size-4" /> : label}
        </button>
      ))}
    </div>
  );

  if (compact) return toggle;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        You are <span className="font-semibold">{name}</span>
      </p>
      {toggle}
    </div>
  );
}
