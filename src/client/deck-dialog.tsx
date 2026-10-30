import { useEffect, useId, useRef, useState } from "react";
import {
  DEFAULT_DECK,
  MAX_CARD,
  MAX_DECK_SIZE,
  MIN_CARD,
  MIN_DECK_SIZE,
  parseDeck,
  sameDeck,
  type Deck,
} from "../shared/deck";
import { CardHand } from "./card-hand";
import { Waiting } from "./waiting";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PRESETS: { name: string; deck: Deck }[] = [
  { name: "Hours", deck: DEFAULT_DECK },
  { name: "Fibonacci", deck: [1, 2, 3, 5, 8, 13, 21, 34] },
  { name: "Powers of two", deck: [1, 2, 4, 8, 16, 32, 64] },
];

function asText(deck: Deck) {
  return deck.join(", ");
}

/**
 * The Facilitator's "Deck" button and the dialog it opens: presets, the Cards as text, and a
 * preview of the hand. Applying a different Deck starts a new Round for everyone. The dialog stays
 * open, locked, until the Room's snapshot carries the new Deck, then closes; if the server refuses
 * it or the connection drops, it says so and can be tried again.
 */
export function DeckDialog({
  deck,
  votesCast,
  disabled,
  busy,
  onApply,
}: {
  deck: Deck;
  /** Votes the new Deck would clear. */
  votesCast: number;
  disabled: boolean;
  /** The Deck sent by `onApply` is waiting on the server. */
  busy: boolean;
  onApply: (deck: Deck) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState(asText(deck));
  const parsed = parseDeck(text);
  const changed = parsed.ok && !sameDeck(parsed.deck, deck);
  const ids = { title: useId(), field: useId(), hint: useId() };
  /** The Deck this dialog sent, until it's opened again. */
  const [sent, setSent] = useState<Deck | null>(null);
  const applied = sent !== null && sameDeck(sent, deck);
  const failed = sent !== null && !applied && !busy;

  useEffect(() => {
    if (applied) dialog.current?.close();
  }, [applied]);

  function open() {
    setText(asText(deck));
    setSent(null);
    dialog.current?.showModal();
  }

  function close() {
    if (!busy) dialog.current?.close();
  }

  /** A new edit makes a failed attempt old news. */
  function edit(next: string) {
    setText(next);
    setSent(null);
  }

  function apply() {
    if (!parsed.ok || busy) return;
    setSent(parsed.deck);
    onApply(parsed.deck);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={open}
        disabled={disabled}
        aria-haspopup="dialog"
      >
        Deck
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={ids.title}
        // The form fills the dialog, so a click on the dialog itself is a click on the backdrop.
        onClick={(event) => event.target === event.currentTarget && close()}
        // Escape mustn't close it while it waits on the server.
        onCancel={(event) => busy && event.preventDefault()}
        className="bg-card text-card-foreground border-ink shadow-hard-lg backdrop:bg-ink/50 m-auto w-[min(960px,calc(100vw-2rem))] rounded-xl border-[3px]"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            apply();
          }}
          className="flex flex-col gap-5 p-6"
        >
          <h2 id={ids.title} className="font-display text-xl font-semibold">
            Choose the Deck
          </h2>

          <div
            role="group"
            aria-label="Presets"
            className="flex flex-wrap gap-2"
          >
            {PRESETS.map((preset) => {
              const picked = parsed.ok && sameDeck(parsed.deck, preset.deck);
              return (
                <button
                  key={preset.name}
                  type="button"
                  disabled={busy}
                  aria-pressed={picked}
                  onClick={() => edit(asText(preset.deck))}
                  className={cn(
                    "border-ink shadow-hard-sm hover:bg-muted focus-visible:ring-ring/50 flex disabled:opacity-50 flex-col items-start rounded-lg border-2 px-3 py-2 text-left outline-none focus-visible:ring-[3px]",
                    picked && "bg-pop-1 text-ink hover:bg-pop-1",
                  )}
                >
                  <span className="font-display font-semibold">
                    {preset.name}
                  </span>
                  <span className="text-xs tabular-nums opacity-70">
                    {preset.deck.join(" ")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={ids.field} className="text-sm font-bold">
              Cards, in hours
            </label>
            <Input
              id={ids.field}
              value={text}
              onChange={(event) => edit(event.target.value)}
              disabled={busy}
              aria-invalid={!parsed.ok}
              aria-describedby={ids.hint}
              autoComplete="off"
              spellCheck={false}
            />
            <p
              id={ids.hint}
              aria-live="polite"
              className={cn(
                "text-sm",
                parsed.ok ? "text-muted-foreground" : "text-destructive",
              )}
            >
              {problemOf(parsed)}
            </p>
          </div>

          <div aria-label="Preview of the hand" role="group">
            <p className="text-muted-foreground mb-1 text-xs font-bold tracking-wide uppercase">
              Preview
            </p>
            <div
              inert
              className="bg-background grid h-(--hand-height) items-center rounded-lg"
            >
              {parsed.ok ? (
                // The whole hand is centred, since the dialog's width, not the box's height, caps
                // its Cards. Its height is the fan's: each Card's margin makes room for its drop.
                <CardHand
                  deck={parsed.deck}
                  myVote={null}
                  onPlay={() => {}}
                  className="h-auto pt-0"
                />
              ) : (
                <p className="text-muted-foreground grid h-full place-items-center text-sm">
                  Fix the Cards to see the hand.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {failed ? (
              <p role="alert" className="text-destructive mr-auto text-sm">
                The Deck wasn't changed. Try again.
              </p>
            ) : (
              <p className="text-muted-foreground mr-auto text-sm">
                {parsed.ok && !changed && "That's the Deck you have."}
                {changed &&
                  (votesCast > 0
                    ? `This starts a new Round and clears ${votesCast} ${votesCast === 1 ? "Vote" : "Votes"}.`
                    : "This starts a new Round.")}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={close}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!changed || busy} aria-busy={busy}>
              {busy && <Waiting />}
              Apply
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}

function problemOf(parsed: ReturnType<typeof parseDeck>) {
  if (parsed.ok) {
    return `Whole numbers from ${MIN_CARD} to ${MAX_CARD}, separated by commas or spaces. ${MIN_DECK_SIZE} to ${MAX_DECK_SIZE} Cards.`;
  }
  switch (parsed.reason) {
    case "not-a-card":
      return `Not a whole number from ${MIN_CARD} to ${MAX_CARD}: ${parsed.notCards.join(", ")}`;
    case "too-few-cards":
      return `At least ${MIN_DECK_SIZE} different Cards.`;
    case "too-many-cards":
      return `At most ${MAX_DECK_SIZE} Cards.`;
  }
}
