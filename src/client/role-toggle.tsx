import type { ParticipantRole } from "../shared/protocol";
import { Button } from "@/components/ui/button";

export function RoleToggle({
  role,
  onBecomeVoter,
  onBecomeObserver,
}: {
  role: ParticipantRole;
  onBecomeVoter: () => void;
  onBecomeObserver: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div role="group" aria-label="Your role" className="flex gap-1">
        <Button
          size="sm"
          variant={role === "voter" ? "default" : "outline"}
          aria-pressed={role === "voter"}
          onClick={role === "voter" ? undefined : onBecomeVoter}
        >
          Voter
        </Button>
        <Button
          size="sm"
          variant={role === "observer" ? "default" : "outline"}
          aria-pressed={role === "observer"}
          onClick={role === "observer" ? undefined : onBecomeObserver}
        >
          Observer
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        {role === "voter"
          ? "You estimate every Round."
          : "You're watching. The Room won't wait for your Vote."}
      </p>
    </div>
  );
}
