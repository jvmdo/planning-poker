/**
 * Bot Observers that Nudge the Holdout, so you can feel a Nudge, or watch one land, without other
 * people. Dev only; never shipped.
 *
 *   1. `npm run dev`, then open http://localhost:5173/<room> and join as a Voter.
 *   2. `npx tsx scripts/nudgers.ts <room>` (add `--count 5` for up to 5 bots; the default is 3).
 *   3. Don't play a Card: you're the only Voter who hasn't, so you're the Holdout. Every few
 *      seconds the bots Nudge you together, one after another, so each burst builds up: with 3
 *      bots it reaches level 3. Play a Card and they stop.
 *
 * They Nudge whoever is the Holdout, bots included: run `scripts/scenarios.ts <room> --holdout`
 * alongside, as an Observer, to watch a bot Holdout's seat take the earthquake. Play a Card or
 * Ctrl+C to stop; Ctrl+C makes every bot Leave the Room. Set SERVER_URL to use another server than
 * :8000.
 */
import { randomUUID } from "node:crypto";
import { io, type Socket } from "socket.io-client";
import { NUDGE_COOLDOWN_MS, NUDGE_TOP_LEVEL } from "../src/shared/fun.js";
import { holdoutOf } from "../src/shared/holdout.js";
import type {
  ClientToServerEvents,
  RoomSnapshot,
  ServerToClientEvents,
} from "../src/shared/protocol.js";

const NAMES = ["Nadia", "Otto", "Pilar", "Quim", "Rosa"];
/** How far apart the bots Nudge within a burst, so you can see it build up. */
const STAGGER_MS = 250;

const args = process.argv.slice(2);
const roomId = args.find((a) => !a.startsWith("--"));
const countIndex = args.indexOf("--count");
const count = countIndex >= 0 ? Number(args[countIndex + 1]) : 3;
if (
  !roomId ||
  !(Number.isInteger(count) && count >= 1 && count <= NUDGE_TOP_LEVEL)
) {
  console.error(
    `Usage: npx tsx scripts/nudgers.ts <room> [--count 1-${NUDGE_TOP_LEVEL}]`,
  );
  process.exit(1);
}
const url = process.env.SERVER_URL ?? "http://localhost:8000";

type BotSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
const bots = NAMES.slice(0, count).map((name) => ({
  id: randomUUID(),
  name,
  socket: io(url, { query: { room: roomId } }) as BotSocket,
}));
/** The Room as the first bot last saw it. */
let latest: RoomSnapshot | null = null;

for (const bot of bots) {
  bot.socket.on("connect", () =>
    bot.socket.emit("join", bot.id, bot.name, "observer"),
  );
  bot.socket.on("rejected", (r) =>
    console.warn(`  ${bot.name}: ${r.command} refused (${r.reason})`),
  );
}
bots[0]?.socket.on("snapshot", (snapshot) => (latest = snapshot));

/** Every bot Nudges the Holdout, if there's one who isn't away, a moment apart. */
function burst() {
  const holdoutId = latest && holdoutOf(latest.participants, latest.revealed);
  const holdout = latest?.participants.find((p) => p.id === holdoutId);
  if (holdout?.connected) {
    console.log(`Nudging ${holdout.name}`);
    bots.forEach((bot, i) =>
      setTimeout(() => bot.socket.emit("nudge", holdout.id), i * STAGGER_MS),
    );
  }
}
// Once they've joined, then just past the cooldown each time, so every Nudge is accepted.
setTimeout(() => {
  burst();
  setInterval(burst, NUDGE_COOLDOWN_MS + 1_000);
}, 1_500);

process.on("SIGINT", () => {
  for (const bot of bots) bot.socket.emit("leave");
  setTimeout(() => process.exit(0), 300);
});

console.log(`Joining ${bots.length} Nudging bots to ${roomId} on ${url}…`);
