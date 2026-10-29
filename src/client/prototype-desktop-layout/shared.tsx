/**
 * PROTOTYPE, throw me away. Desktop layout variants for the Room view, switchable via
 * `?variant=A|B|C|current`. Add `&fake=11` to pad the Room with read-only fake Participants.
 * Lives on the `prototype/desktop-layout` branch only; never merge into main.
 */
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type {
  ParticipantId,
  ParticipantRole,
  ParticipantView,
  RoomSnapshot,
} from "../../shared/protocol";
import type { Card } from "../../shared/deck";
import { Button } from "@/components/ui/button";

export interface RoomViewProps {
  snapshot: RoomSnapshot;
  me: ParticipantView;
  /** Connection status, notices and the Claim Facilitator banner. */
  alerts: ReactNode;
  onVote: (card: Card) => void;
  onReveal: () => void;
  onNewRound: () => void;
  onBecomeVoter: () => void;
  onBecomeObserver: () => void;
  onHandOver?: (to: ParticipantId) => void;
}

export const VARIANTS = [
  { key: "A", name: "Poker table" },
  { key: "B", name: "Sidebar + stage" },
  { key: "C", name: "Board + deck rail" },
  { key: "current", name: "Current layout" },
] as const;

export type VariantKey = (typeof VARIANTS)[number]["key"];

function readVariant(): VariantKey {
  const value = new URLSearchParams(location.search).get("variant");
  return VARIANTS.find((v) => v.key === value)?.key ?? "A";
}

export function useVariant() {
  const [variant, setVariant] = useState(readVariant);
  useEffect(() => {
    const onPop = () => setVariant(readVariant());
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  function select(next: VariantKey) {
    const url = new URL(location.href);
    url.searchParams.set("variant", next);
    history.replaceState(null, "", url);
    setVariant(next);
  }
  return [variant, select] as const;
}

export function PrototypeSwitcher({
  variant,
  onSelect,
}: {
  variant: VariantKey;
  onSelect: (next: VariantKey) => void;
}) {
  const index = VARIANTS.findIndex((v) => v.key === variant);
  const step = (by: number) =>
    onSelect(VARIANTS[(index + by + VARIANTS.length) % VARIANTS.length]!.key);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    }
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full bg-fuchsia-700 px-2 py-1 text-sm text-white shadow-lg ring-2 ring-fuchsia-300">
      <button
        aria-label="Previous variant"
        className="rounded-full p-1 hover:bg-white/20"
        onClick={() => step(-1)}
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="min-w-44 text-center font-medium">
        {variant === "current" ? "Current" : variant} ({VARIANTS[index]!.name})
      </span>
      <button
        aria-label="Next variant"
        className="rounded-full p-1 hover:bg-white/20"
        onClick={() => step(1)}
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

const FAKE_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Elisa",
  "Felipe",
  "Gabriela Montenegro",
  "Hugo",
  "Iris",
  "Karen",
  "Lucas",
  "Marina",
  "Nico",
  "Otávio",
];
const FAKE_VOTES: Card[] = [8, 6, 8, 12, 4, 8, 16, 6, 8, 32, 10, 8, 4, 12];

/** Pads the snapshot with read-only fake Participants so the layouts can be judged at team size. */
export function withFakes(snapshot: RoomSnapshot): RoomSnapshot {
  const count = Number(new URLSearchParams(location.search).get("fake") ?? 0);
  if (!count) return snapshot;
  const fakes: ParticipantView[] = FAKE_NAMES.slice(0, count).map((name, i) => {
    const role: ParticipantRole = i % 6 === 5 ? "observer" : "voter";
    const hasVoted = role === "voter" && i % 4 !== 3;
    return {
      id: `fake-${i}`,
      name,
      role,
      isFacilitator: false,
      hasVoted,
      vote: snapshot.revealed && hasVoted ? FAKE_VOTES[i]! : null,
      connected: i !== 4,
    };
  });
  const participants = [...snapshot.participants, ...fakes];
  const votes = participants.flatMap((p) => (p.vote === null ? [] : [p.vote]));
  const result =
    snapshot.revealed && votes.length
      ? Math.round((votes.reduce((a, b) => a + b, 0) / votes.length) * 10) / 10
      : null;
  return { ...snapshot, participants, result };
}

export function RoleSwitch({
  role,
  onBecomeVoter,
  onBecomeObserver,
}: {
  role: ParticipantRole;
  onBecomeVoter: () => void;
  onBecomeObserver: () => void;
}) {
  return (
    <div
      role="group"
      aria-label="Your role"
      className="bg-muted inline-flex rounded-md p-0.5"
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
              ? "bg-background rounded px-3 py-1 text-sm font-medium shadow-xs"
              : "text-muted-foreground rounded px-3 py-1 text-sm"
          }
        >
          {r === "voter" ? "Voter" : "Observer"}
        </button>
      ))}
    </div>
  );
}

export function FacilitatorControls({
  snapshot,
  onReveal,
  onNewRound,
  size,
}: {
  snapshot: RoomSnapshot;
  onReveal: () => void;
  onNewRound: () => void;
  size?: "default" | "lg";
}) {
  const anyVotes = snapshot.participants.some((p) => p.hasVoted);
  return (
    <div className="flex gap-2">
      {!snapshot.revealed && (
        <Button size={size} onClick={onReveal} disabled={!anyVotes}>
          Reveal
        </Button>
      )}
      <Button size={size} variant="outline" onClick={onNewRound}>
        New Round
      </Button>
    </div>
  );
}

export function confirmHandOver(
  p: ParticipantView,
  onHandOver?: (to: ParticipantId) => void,
) {
  if (window.confirm(`Make ${p.name} the Facilitator?`)) onHandOver?.(p.id);
}

export function voterStats(snapshot: RoomSnapshot) {
  const voters = snapshot.participants.filter((p) => p.role === "voter");
  const voted = voters.filter((p) => p.hasVoted);
  const waiting = voters.filter((p) => !p.hasVoted);
  const votes = snapshot.participants.flatMap((p) =>
    p.vote === null ? [] : [p.vote],
  );
  return {
    voters,
    voted,
    waiting,
    min: votes.length ? Math.min(...votes) : null,
    max: votes.length ? Math.max(...votes) : null,
  };
}
