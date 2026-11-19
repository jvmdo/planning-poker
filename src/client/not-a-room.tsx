import { MAX_ROOM_ID_LENGTH } from "../shared/room-id";
import { Logo } from "./logo";
import { ThemeSwitch } from "./theme-switch";
import { Button } from "@/components/ui/button";

/** The page for a URL whose path can't be a Room ID. */
export function NotARoom() {
  return (
    <main className="relative grid min-h-svh place-items-center px-8">
      <div className="absolute top-5 right-5">
        <ThemeSwitch />
      </div>
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <Logo className="size-20" />
        <h1 className="font-display text-3xl font-semibold">
          Not a valid Room
        </h1>
        <p className="text-muted-foreground">
          A Room ID is 1 to {MAX_ROOM_ID_LENGTH} letters, digits and dashes, as
          in <span className="text-foreground">/team-alpha</span>. Check the
          link you followed.
        </p>
        <Button asChild size="lg" className="mt-2 h-12 px-7 text-base">
          <a href="/">Go to Planning Poker</a>
        </Button>
      </div>
    </main>
  );
}
