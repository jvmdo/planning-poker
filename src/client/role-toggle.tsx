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
        className="bg-card border-ink shadow-hard-sm inline-flex self-start rounded-full border-2 p-[3px]"
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
                ? "bg-foreground text-background rounded-full px-3 py-1 text-sm font-bold"
                : "text-foreground hover:bg-muted rounded-full px-3 py-1 text-sm font-bold"
            }
          >
            {r === "voter" ? "Voter" : "Observer"}
          </button>
        ))}
      </div>
    </div>
  );
}
