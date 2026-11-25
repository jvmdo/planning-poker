/**
 * Plays the Outlier scenarios from `.scratch/planning-poker/issues/22-outliers.md` in a real Room,
 * with bot Voters, so you can watch each outcome in the browser. Dev only; never shipped.
 *
 *   1. `npm run dev`, then open http://localhost:5173/<room> and join, so you're the Facilitator.
 *      Turn yourself into an Observer so your Vote doesn't change the scenario.
 *   2. `npx tsx scripts/scenarios.ts <room>` (add `--from 5` to start at scenario 5).
 *   3. The bots play the first scenario. Click Reveal, look, then New Round for the next one.
 *
 * Bot Observers bring out Ghosts that wander round the Table, now and then parking on a Voter's
 * Card (it says whose), so you can check it sits on that Card in every Voter's browser. Each comes
 * out in a random Skin and changes it now and then. `--ghosts 0` leaves them out; the default is 1.
 *
 * `--holdout` leaves the last bot Voter of each scenario without a Vote, as the Holdout, so you can
 * Nudge them. The Round then waits for your Reveal, which leaves their Card out.
 *
 * Ctrl+C makes every bot Leave the Room. Set SERVER_URL to use another server than :8000.
 */
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import type { Card } from "../src/shared/deck.js";
import { DEFAULT_DECK } from "../src/shared/deck.js";
import { randomSkin, type TablePoint } from "../src/shared/ghost.js";
import { seatLayout } from "../src/client/lib/seat-layout.js";
import type {
  ClientToServerEvents,
  RoomSnapshot,
  ServerToClientEvents,
} from "../src/shared/protocol.js";

interface Scenario {
  /** Each Voter's Card, in seat order; bots are named in this order. */
  votes: Card[];
  expected: string;
}

/** `[Card, count]` pairs, in order. */
const play = (...groups: [Card, number][]) =>
  groups.flatMap(([card, count]) => Array<Card>(count).fill(card));

/** The scenarios table of issue 22, on the default Deck. */
const SCENARIOS: Scenario[] = [
  { votes: play([8, 6]), expected: "Everyone agrees 🎯" },
  { votes: play([8, 6], [6, 1]), expected: "Nearly everyone agrees" },
  {
    votes: play([6, 2], [8, 2], [10, 1]),
    expected: "Nearly everyone agrees",
  },
  { votes: play([6, 1], [8, 1]), expected: "Nearly everyone agrees" },
  {
    votes: play([8, 3], [16, 1], [32, 1]),
    expected: "Ask {16h} and {32h} why",
  },
  {
    votes: play([1, 1], [8, 3], [12, 2]),
    expected: "Ask {1h} and {both 12h} why",
  },
  {
    votes: play([6, 1], [8, 3], [10, 1], [24, 1]),
    expected: "Ask {24h} why",
  },
  { votes: play([2, 2], [8, 1], [32, 1]), expected: "Ask {8h} and {32h} why" },
  { votes: play([4, 3], [8, 3]), expected: "Split between 4h and 8h" },
  {
    votes: play([4, 3], [6, 1], [8, 3]),
    expected: "Split between 4h and 8h",
  },
  {
    votes: play([4, 2], [16, 2], [64, 1]),
    expected: "No consensus: 4h to 64h",
  },
  {
    votes: play([8, 2], [24, 1], [32, 1], [64, 1]),
    expected: "No consensus: 8h to 64h",
  },
  {
    votes: play([1, 1], [4, 1], [8, 1], [16, 1], [64, 1]),
    expected: "No consensus: 1h to 64h",
  },
  { votes: play([8, 1]), expected: "Nothing" },
];

const NAMES = ["Ana", "Bruno", "Carla", "Davi", "Eva", "Fábio", "Gabi"];
const GHOST_NAMES = ["Boo", "Wisp", "Casper", "Shade"];
const SEATS = Math.max(...SCENARIOS.map((s) => s.votes.length));

const args = process.argv.slice(2);
const roomId = args.find((a) => !a.startsWith("--"));
const fromIndex = args.indexOf("--from");
let current = fromIndex >= 0 ? Number(args[fromIndex + 1]) - 1 : 0;
const ghostsIndex = args.indexOf("--ghosts");
const ghostCount = ghostsIndex >= 0 ? Number(args[ghostsIndex + 1]) : 1;
const leaveHoldout = args.includes("--holdout");
if (
  !roomId ||
  !(current >= 0 && current < SCENARIOS.length) ||
  !(Number.isInteger(ghostCount) && ghostCount >= 0) ||
  ghostCount > GHOST_NAMES.length
) {
  console.error(
    `Usage: npx tsx scripts/scenarios.ts <room> [--from 1-${SCENARIOS.length}] [--ghosts 0-${GHOST_NAMES.length}] [--holdout]`,
  );
  process.exit(1);
}
const url = process.env.SERVER_URL ?? "http://localhost:8000";

type BotSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
const bots = NAMES.slice(0, SEATS).map((name) => ({
  id: randomUUID(),
  name,
  socket: io(url, { query: { room: roomId } }) as BotSocket,
}));
const ghostBots = GHOST_NAMES.slice(0, ghostCount).map((name) => ({
  id: randomUUID(),
  name,
  socket: io(url, { query: { room: roomId } }) as BotSocket,
}));
const botIds = new Set<string>([...bots, ...ghostBots].map((b) => b.id));
/** The Room as the first bot last saw it. */
let latest: RoomSnapshot | null = null;

/** Somewhere new to walk to: a random spot round the Table, or now and then a Voter's Card. */
function wanderFrom(name: string): TablePoint {
  // Seats as an Observer sees them, which is the shared Table.
  const { seats } = seatLayout(latest?.participants ?? [], "");
  const seat = seats[Math.floor(Math.random() * seats.length)];
  if (seat && Math.random() < 0.4) {
    console.log(
      `  ${name}'s Ghost is parking on ${seat.participant.name}'s Card`,
    );
    return { x: seat.x, y: seat.y };
  }
  const anywhere = () => -0.3 + Math.random() * 1.6;
  return { x: anywhere(), y: anywhere() };
}

for (const bot of ghostBots) {
  bot.socket.on("connect", () => {
    bot.socket.emit("join", bot.id, bot.name);
    bot.socket.emit("becomeObserver");
    bot.socket.emit("summonGhost", randomSkin());
  });
  bot.socket.on("rejected", (r) =>
    console.warn(`  ${bot.name}: ${r.command} refused (${r.reason})`),
  );
  const wander = () => {
    if (bot.socket.connected) {
      bot.socket.emit("moveGhost", wanderFrom(bot.name));
      if (Math.random() < 0.2) bot.socket.emit("dressGhost", randomSkin());
    }
    setTimeout(wander, 3000 + Math.random() * 4000);
  };
  setTimeout(wander, 2000 + Math.random() * 2000);
}

for (const bot of bots) {
  bot.socket.on("connect", () => bot.socket.emit("join", bot.id, bot.name));
  bot.socket.on("rejected", (r) =>
    console.warn(`  ${bot.name}: ${r.command} refused (${r.reason})`),
  );
}

/** Seats the bots this scenario needs as Voters and plays their Cards; the rest observe. */
function playScenario(index: number) {
  const scenario = SCENARIOS[index];
  if (!scenario) return;
  console.log(
    `\nScenario ${index + 1}/${SCENARIOS.length}: ${scenario.votes.join(", ")}` +
      `\n  Expect: ${scenario.expected}` +
      `\n  Click Reveal, then New Round for the next scenario.`,
  );
  const holdout = leaveHoldout ? bots[scenario.votes.length - 1] : undefined;
  if (holdout) console.log(`  ${holdout.name} is the Holdout: Nudge them!`);
  bots.forEach((bot, seat) => {
    const card = scenario.votes[seat];
    if (card === undefined) bot.socket.emit("becomeObserver");
    else {
      bot.socket.emit("becomeVoter");
      if (bot !== holdout) bot.socket.emit("vote", card);
    }
  });
}

// The first bot watches the Room for the rest.
let playedRound: number | null = null;
let warned = false;
bots[0]?.socket.on("snapshot", (snapshot: RoomSnapshot) => {
  latest = snapshot;
  if (bots.some((b) => !snapshot.participants.some((p) => p.id === b.id)))
    return; // Still joining.

  const people = snapshot.participants.filter((p) => !botIds.has(p.id));
  const facilitator = snapshot.participants.find((p) => p.isFacilitator);
  // A bot that became Facilitator hands the role to you, so you can Reveal.
  if (facilitator && botIds.has(facilitator.id) && people[0])
    bots
      .find((b) => b.id === facilitator.id)
      ?.socket.emit("handOver", people[0].id);

  if (!warned) {
    warned = true;
    if (people.length === 0)
      console.warn("Nobody else is in the Room: open it in your browser.");
    if (people.some((p) => p.role === "voter"))
      console.warn(
        "You're a Voter, so your Vote counts too. Switch to Observer to match the table.",
      );
    if (snapshot.deck.join() !== DEFAULT_DECK.join())
      console.warn(
        "The Deck isn't the default one: some Votes will be refused.",
      );
  }

  if (snapshot.revealed || snapshot.round === playedRound) return;
  if (playedRound !== null) current++;
  playedRound = snapshot.round;
  if (current < SCENARIOS.length) playScenario(current);
  else console.log("\nThat was the last scenario. Ctrl+C to remove the bots.");
});

process.on("SIGINT", () => {
  for (const bot of [...bots, ...ghostBots]) bot.socket.emit("leave");
  setTimeout(() => process.exit(0), 300);
});

console.log(
  `Joining ${bots.length + ghostBots.length} bots to ${roomId} on ${url}…`,
);
