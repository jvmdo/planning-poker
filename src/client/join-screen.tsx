import { useState, type FormEvent } from "react";
import type { RejectionReason } from "../shared/protocol";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const REJECTION_MESSAGES: Record<RejectionReason, string> = {
  "name-empty": "Please type a display name.",
  "name-taken":
    "Someone in the Room is already using that name. Please pick another one.",
};

export function JoinScreen({
  initialName,
  rejection,
  disabled,
  onJoin,
}: {
  initialName: string;
  rejection: RejectionReason | null;
  disabled: boolean;
  onJoin: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);

  function submit(event: FormEvent) {
    event.preventDefault();
    onJoin(name);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join the Room</CardTitle>
        <CardDescription>Pick the name your team will see.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            aria-label="Display name"
            placeholder="Your name"
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={rejection !== null}
            aria-describedby={rejection ? "join-error" : undefined}
          />
          <Button type="submit" disabled={disabled || name.trim() === ""}>
            Join
          </Button>
        </form>
        {rejection && (
          <p
            id="join-error"
            role="alert"
            className="text-destructive mt-3 text-sm"
          >
            {REJECTION_MESSAGES[rejection]}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
