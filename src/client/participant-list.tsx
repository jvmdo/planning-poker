import {
  GRACE_PERIOD_MS,
  type ParticipantId,
  type ParticipantView,
} from "../shared/protocol";
import { Check, Crown, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ParticipantList({
  participants,
  myId,
  revealed,
  onHandOver,
}: {
  participants: ParticipantView[];
  myId: ParticipantId;
  revealed: boolean;
  /** Only given to the Facilitator, who can hand the role to anyone else. */
  onHandOver?: (to: ParticipantId) => void;
}) {
  function handOverLabel(p: ParticipantView) {
    return `Make ${p.name} the Facilitator`;
  }

  function confirmHandOver(p: ParticipantView) {
    if (window.confirm(`${handOverLabel(p)}?`)) onHandOver?.(p.id);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {participants.map((p) => (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-2 py-2",
                !p.connected && "opacity-60",
              )}
            >
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <span className="min-w-0 truncate font-medium">
                  {p.name}
                  {p.id === myId && (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      (you)
                    </span>
                  )}
                </span>
                {p.isFacilitator && <Badge>Facilitator</Badge>}
                {!p.connected && (
                  <Badge
                    variant="outline"
                    title={`Reconnecting. Removed after ${GRACE_PERIOD_MS / 1000} seconds away.`}
                  >
                    <WifiOff aria-hidden className="size-3" />
                    Away
                  </Badge>
                )}
                {p.hasVoted && (
                  <Badge variant="secondary">
                    <Check aria-hidden className="size-3" />
                    Voted
                  </Badge>
                )}
              </div>
              {onHandOver && !p.isFacilitator && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 shrink-0 p-0"
                  aria-label={handOverLabel(p)}
                  title={handOverLabel(p)}
                  onClick={() => confirmHandOver(p)}
                >
                  <Crown aria-hidden className="size-4" />
                </Button>
              )}
              <Badge variant="outline">
                {p.role === "voter" ? "Voter" : "Observer"}
              </Badge>
              {revealed && (
                <span
                  aria-label={
                    p.vote === null ? "No Vote" : `Voted ${p.vote} hours`
                  }
                  className="flex size-9 shrink-0 items-center justify-center rounded-md border font-semibold"
                >
                  {p.vote ?? "–"}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
