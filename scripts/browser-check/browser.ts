/**
 * Helpers for scripted browser checks against the isolated server that `server.sh start` runs.
 * Dev only; never shipped. See `.claude/skills/browser-check/SKILL.md` for how to use them.
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join as joinPath } from "node:path";
import { randomUUID } from "node:crypto";
import { chromium, type Browser, type Page } from "playwright-core";
import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  RoomSnapshot,
  ServerToClientEvents,
} from "../../src/shared/protocol.js";

export const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3100";

/**
 * The Chromium to drive: `CHROMIUM_PATH`, or the newest headless shell Playwright has cached.
 * Downloading one may fail behind the corporate TLS proxy, so the cache is used as it is.
 */
function chromiumPath(): string {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const cache = joinPath(homedir(), ".cache", "ms-playwright");
  const newest = (existsSync(cache) ? readdirSync(cache) : [])
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]))[0];
  if (!newest)
    throw new Error(`No headless Chromium in ${cache}; set CHROMIUM_PATH`);
  return joinPath(
    cache,
    newest,
    "chrome-headless-shell-linux64",
    "chrome-headless-shell",
  );
}

export function launch(): Promise<Browser> {
  return chromium.launch({ executablePath: chromiumPath() });
}

export interface ParticipantOptions {
  /** Defaults to a desktop 1280×800. A phone is about 390×844. */
  viewport?: { width: number; height: number };
  colorScheme?: "light" | "dark";
  reducedMotion?: "reduce" | "no-preference";
}

/**
 * Opens the Room in a fresh browser context (its own storage, so its own Participant), types the
 * name and presses Enter as a person would, and waits for the Table.
 */
export async function join(
  browser: Browser,
  room: string,
  name: string,
  options: ParticipantOptions = {},
): Promise<Page> {
  const context = await browser.newContext({
    viewport: options.viewport ?? { width: 1280, height: 800 },
    colorScheme: options.colorScheme ?? "light",
    reducedMotion: options.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  await page.goto(`${SERVER_URL}/${room}`);
  await page.getByRole("textbox", { name: "Display name" }).fill(name);
  await page.keyboard.press("Enter");
  await page.getByRole("region", { name: "Table" }).waitFor();
  return page;
}

/** Clicks the Observer side of the role toggle. */
export async function becomeObserver(page: Page): Promise<void> {
  await page
    .getByRole("group", { name: "Your role" })
    .getByRole("button", { name: "Observer" })
    .click();
}

export type BotSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface Bot {
  socket: BotSocket;
  id: string;
  /** The latest snapshot this bot has seen. */
  snapshot: () => RoomSnapshot | null;
  leave: () => void;
}

/**
 * A Participant with no browser, straight on the socket, to fill a Room cheaply: emit any
 * command on `bot.socket` (`vote`, `summonGhost`, `moveGhost`, ...).
 */
export async function bot(
  room: string,
  name: string,
  role: "voter" | "observer" = "voter",
): Promise<Bot> {
  const socket: BotSocket = io(SERVER_URL, { query: { room } });
  const id = randomUUID();
  let latest: RoomSnapshot | null = null;
  socket.on("snapshot", (s) => (latest = s));
  await new Promise<void>((resolve) => socket.once("connect", resolve));
  socket.emit("join", id, name, role);
  await new Promise<void>((resolve) =>
    socket.once("snapshot", () => resolve()),
  );
  return {
    socket,
    id,
    snapshot: () => latest,
    leave: () => {
      socket.emit("leave");
      socket.disconnect();
    },
  };
}
