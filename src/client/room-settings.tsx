import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Settings, X } from "lucide-react";
import { useId, useRef } from "react";
import type { RoomSnapshot } from "../shared/protocol";
import { DeckDialog, READ_ONLY_NOTE } from "./deck-dialog";
import type { PendingCommand } from "./pending";
import { Waiting } from "./waiting";

/**
 * The gear button and the Room's settings it opens: Auto Reveal and the Deck. Everyone can open
 * it; only the Facilitator can change anything, and everyone else is told so.
 */
export function RoomSettings({
  snapshot,
  isFacilitator,
  locked,
  pendingCommand,
  onSetAutoReveal,
  onSetDeck,
}: {
  snapshot: RoomSnapshot;
  isFacilitator: boolean;
  /** Something is waiting on the server, or the connection is down: nothing can be sent. */
  locked: boolean;
  pendingCommand: PendingCommand["command"] | null;
  onSetAutoReveal: (on: boolean) => void;
  onSetDeck: Parameters<typeof DeckDialog>[0]["onApply"];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const ids = { title: useId(), autoReveal: useId(), hint: useId() };
  const readOnly = !isFacilitator;
  const busy = pendingCommand === "setAutoReveal";

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Room settings"
        title="Room settings"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
        /* cancel the ghost padding so the icon lines up with the panel's padding */
        className="size-9 px-0 -mr-2"
      >
        <Settings aria-hidden className="size-5" />
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={ids.title}
        onClick={(event) =>
          event.target === event.currentTarget && dialog.current?.close()
        }
        className="bg-card text-card-foreground border-ink shadow-hard-lg backdrop:bg-ink/50 m-auto w-[min(420px,calc(100vw-2rem))] rounded-xl border-[3px]"
      >
        <div className="flex flex-col gap-5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 id={ids.title} className="font-display text-xl font-semibold">
              Room settings
            </h2>
            {/* The same size as the gear that opened it. */}
            <Button
              variant="outline"
              aria-label="Close"
              title="Close"
              onClick={() => dialog.current?.close()}
              className="size-9 px-0"
            >
              <X aria-hidden className="size-4" />
            </Button>
          </div>

          <div className="divide-ink/15 flex flex-col divide-y-2">
            <div className="flex items-center gap-4 pb-4">
              <div className="min-w-0 flex-1">
                <label htmlFor={ids.autoReveal} className="font-bold">
                  Auto Reveal
                </label>
                <p id={ids.hint} className="text-muted-foreground text-sm">
                  Reveal the Votes a few seconds after every Voter has played.
                </p>
              </div>
              <button
                id={ids.autoReveal}
                type="button"
                role="switch"
                aria-checked={snapshot.autoReveal}
                aria-describedby={ids.hint}
                aria-busy={busy}
                disabled={readOnly || locked}
                onClick={() => onSetAutoReveal(!snapshot.autoReveal)}
                // A Button's height, border, hard shadow and press, so it matches the Deck's button.
                className={cn(
                  "border-ink shadow-hard-sm relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border-2 transition-all outline-none",
                  "focus-visible:ring-ring/50 focus-visible:ring-[3px] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-50",
                  snapshot.autoReveal ? "bg-pop-1" : "bg-background",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "bg-card border-ink text-ink grid size-6 place-items-center rounded-full border-2 transition-transform",
                    snapshot.autoReveal ? "translate-x-8" : "translate-x-1",
                  )}
                >
                  {busy ? (
                    <Waiting />
                  ) : (
                    snapshot.autoReveal && (
                      <Check className="size-3.5" strokeWidth={3} />
                    )
                  )}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="min-w-0 flex-1">
                <p className="font-bold">Deck</p>
                <p className="text-muted-foreground truncate text-sm tabular-nums">
                  {snapshot.deck.join(" ")}
                </p>
              </div>
              <DeckDialog
                deck={snapshot.deck}
                votesCast={
                  snapshot.participants.filter((p) => p.hasVoted).length
                }
                disabled={!readOnly && locked}
                busy={pendingCommand === "setDeck"}
                canApply={!readOnly}
                onApply={onSetDeck}
              />
            </div>
          </div>

          {readOnly && (
            <p className="text-muted-foreground text-sm">{READ_ONLY_NOTE}</p>
          )}
        </div>
      </dialog>
    </>
  );
}
