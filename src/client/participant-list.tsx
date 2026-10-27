import type { ParticipantId, ParticipantView } from "../shared/protocol";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ParticipantList({
  participants,
  myId,
}: {
  participants: ParticipantView[];
  myId: ParticipantId;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {participants.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-2 py-2">
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
              <Badge variant="outline" className="ml-auto">
                {p.role === "voter" ? "Voter" : "Observer"}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
