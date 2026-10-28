import type { ParticipantId, ParticipantView } from "../shared/protocol";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ParticipantList({
  participants,
  myId,
  revealed,
}: {
  participants: ParticipantView[];
  myId: ParticipantId;
  revealed: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {participants.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-2">
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
                {p.hasVoted && (
                  <Badge variant="secondary">
                    <Check aria-hidden className="size-3" />
                    Voted
                  </Badge>
                )}
              </div>
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
