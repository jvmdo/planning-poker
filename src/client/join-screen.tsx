import { useState, type FormEvent, type ReactNode } from "react";
import type { JoinRejectionReason } from "../shared/protocol";
import { DEFAULT_DECK, type Card } from "../shared/deck";
import { Logo } from "./logo";
import { useCardFlair } from "./lib/use-card-flair";
import { PlayingCard } from "./playing-card";
import { ThemeSwitch } from "./theme-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const REJECTION_MESSAGES: Record<JoinRejectionReason, string> = {
  "name-empty": "Please type a display name.",
  "name-taken":
    "Someone in the Room is already using that name. Please pick another one.",
};

/**
 * The page before you're in the Room: the app and how a Round works on the left; on the right the
 * name form as a big Card, and the Deck to play with while the server wakes up.
 */
export function JoinScreen({
  initialName,
  rejection,
  disabled,
  joining,
  alerts,
  onJoin,
}: {
  initialName: string;
  rejection: JoinRejectionReason | null;
  disabled: boolean;
  /** Joined already, waiting for the Room to answer. */
  joining: boolean;
  /** The connecting banner. */
  alerts: ReactNode;
  onJoin: (name: string) => void;
}) {
  return (
    <main className="grid min-h-svh grid-cols-2">
      <AboutPanel />
      <section className="relative flex flex-col px-8">
        <div className="absolute top-5 right-5">
          <ThemeSwitch />
        </div>
        {/* The top padding sets the form level with the left panel's content. */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4 pt-16">
          <div className="flex w-full max-w-md flex-col gap-3">{alerts}</div>
          <NameCard
            initialName={initialName}
            rejection={rejection}
            disabled={disabled || joining}
            joining={joining}
            onJoin={onJoin}
          />
        </div>
        <WarmUpDeck />
      </section>
    </main>
  );
}

function AboutPanel() {
  return (
    // The bottom padding lifts the content level with the form, which shares its half with the Deck.
    <section className="bg-secondary border-ink relative flex flex-col justify-center gap-10 border-r-[3px] px-16 pt-12 pb-28">
      <div className="flex items-center gap-4">
        <Logo className="size-24 shrink-0" />
        <div>
          <h1 className="font-display text-4xl font-semibold">
            Planning Poker
          </h1>
          <p className="text-muted-foreground text-lg">
            The team's estimates, in hours.
          </p>
        </div>
      </div>
      <ol className="flex flex-col gap-6">
        <Step n={1} title="Everyone picks a Card in secret">
          <div className="border-ink shadow-hard-sm flex h-16 w-12 items-center justify-center rounded-lg border-[3px] bg-[repeating-linear-gradient(45deg,var(--pop-2)_0_5px,var(--secondary)_5px_7px)]" />
        </Step>
        <Step n={2} title="The Facilitator reveals them all at once">
          <div className="font-display border-ink bg-card shadow-hard-sm flex h-16 w-12 rotate-6 items-center justify-center rounded-lg border-[3px] text-2xl font-semibold">
            8
          </div>
        </Step>
        <Step n={3} title="The Result is the mean, worked out for you">
          <div className="font-display border-ink bg-pop-4 text-ink shadow-hard-sm rounded-full border-[3px] px-2.5 py-1.5 text-base font-semibold whitespace-nowrap">
            11.1 h
          </div>
        </Step>
      </ol>
      <p className="text-muted-foreground absolute bottom-6 left-16 max-w-md text-xs">
        Hosted on the{" "}
        <a
          href="https://render.com/docs/free"
          target="_blank"
          rel="noreferrer"
          className="text-foreground underline underline-offset-2"
        >
          Render free plan
        </a>
        : after a while without visitors the server goes to sleep, and the first
        visit can take up to a minute to wake it. It may also be down now and
        then.
      </p>
    </section>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex items-center gap-5">
      <span className="font-display bg-card border-ink grid size-9 shrink-0 place-items-center rounded-full border-2 font-semibold">
        {n}
      </span>
      <div aria-hidden className="grid w-20 shrink-0 place-items-center">
        {children}
      </div>
      <span className="text-lg font-semibold">{title}</span>
    </li>
  );
}

/** The name form, as a big tilted Card with "?" in its corners. */
function NameCard({
  initialName,
  rejection,
  disabled,
  joining,
  onJoin,
}: {
  initialName: string;
  rejection: JoinRejectionReason | null;
  disabled: boolean;
  joining: boolean;
  onJoin: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);

  function submit(event: FormEvent) {
    event.preventDefault();
    onJoin(name);
  }

  return (
    <div className="bg-card border-ink shadow-hard-lg relative flex w-[22rem] -rotate-2 flex-col gap-4 rounded-[1.6rem] border-[3px] p-7">
      <span
        aria-hidden
        className="font-display text-primary absolute top-3 left-4 text-xl font-semibold"
      >
        ?
      </span>
      <span
        aria-hidden
        className="font-display text-primary absolute right-4 bottom-3 rotate-180 text-xl font-semibold"
      >
        ?
      </span>
      <h2 className="font-display mt-4 text-center text-3xl font-semibold">
        Take a seat
      </h2>
      <p className="text-muted-foreground text-center text-sm">
        Pick the name your team will see.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <Input
          aria-label="Display name"
          placeholder="Your name"
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={rejection !== null}
          aria-describedby={rejection ? "join-error" : undefined}
          className="h-12 px-5 text-lg md:text-lg"
        />
        <Button
          type="submit"
          size="lg"
          className="h-12 px-7 text-base"
          disabled={disabled || name.trim() === ""}
        >
          {joining ? "Joining…" : "Join the Room"}
        </Button>
        {rejection && (
          <p id="join-error" role="alert" className="text-destructive text-sm">
            {REJECTION_MESSAGES[rejection]}
          </p>
        )}
      </form>
      <p className="text-muted-foreground mb-3 text-center text-xs">
        No account needed. This browser remembers you.
      </p>
    </div>
  );
}

/** The default Deck in a row, to play with while waiting. Nothing is sent to the Room. */
function WarmUpDeck() {
  const [picked, setPicked] = useState<Card | null>(null);
  const { play, flairOf } = useCardFlair();

  return (
    <div role="group" aria-label="Try the Cards" className="pb-12">
      <p className="text-muted-foreground mb-3 text-center text-sm">
        Warm up while you wait: play a Card.
      </p>
      <div className="flex justify-center gap-3">
        {DEFAULT_DECK.map((card, index) => (
          <PlayingCard
            key={card}
            card={card}
            selected={card === picked}
            flair={flairOf(card)}
            paletteIndex={index}
            onClick={(event) => {
              play(card, event);
              setPicked(card);
            }}
            className="h-15 w-11 text-xl"
          />
        ))}
      </div>
    </div>
  );
}
