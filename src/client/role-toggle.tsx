import type { ParticipantRole } from "../shared/protocol";

export function RoleToggle({
  name,
  role,
  onBecomeVoter,
  onBecomeObserver,
}: {
  name: string;
  role: ParticipantRole;
  onBecomeVoter: () => void;
  onBecomeObserver: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 border-t p-4">
      <p className="text-sm">
        You are <span className="font-semibold">{name}</span>
      </p>
      <div
        role="group"
        aria-label="Your role"
        className="bg-muted inline-flex self-start rounded-md p-0.5"
      >
        {(["voter", "observer"] as const).map((r) => (
          <button
            key={r}
            aria-pressed={role === r}
            onClick={
              role === r
                ? undefined
                : r === "voter"
                  ? onBecomeVoter
                  : onBecomeObserver
            }
            className={
              role === r
                ? "bg-background rounded px-3 py-1 text-sm font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground rounded px-3 py-1 text-sm"
            }
          >
            {r === "voter" ? "Voter" : "Observer"}
          </button>
        ))}
      </div>
    </div>
  );
}
