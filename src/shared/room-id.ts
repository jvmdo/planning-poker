import type { RoomId } from "./protocol.js";

export const MAX_ROOM_ID_LENGTH = 40;

const ROOM_ID = new RegExp(`^[A-Za-z0-9-]{1,${MAX_ROOM_ID_LENGTH}}$`);

/**
 * Reads a Room ID from untrusted input: 1 to `MAX_ROOM_ID_LENGTH` characters from `a–z`, `0–9` and `-`, with
 * uppercase converted to lowercase. Null when it isn't a Room ID. The client reads the URL with
 * it, and the server checks what the client sends.
 */
export function parseRoomId(value: unknown): RoomId | null {
  if (typeof value !== "string" || !ROOM_ID.test(value)) return null;
  return value.toLowerCase();
}

const ADJECTIVES = [
  "agile",
  "amber",
  "bold",
  "brave",
  "breezy",
  "bright",
  "brisk",
  "bubbly",
  "calm",
  "cheery",
  "clever",
  "cosmic",
  "cozy",
  "crisp",
  "curly",
  "daring",
  "dapper",
  "eager",
  "fancy",
  "fluffy",
  "frosty",
  "fuzzy",
  "gentle",
  "giddy",
  "glossy",
  "golden",
  "grand",
  "happy",
  "hasty",
  "humble",
  "jolly",
  "jumpy",
  "keen",
  "kind",
  "lively",
  "lucky",
  "lunar",
  "mellow",
  "merry",
  "mighty",
  "misty",
  "modest",
  "nimble",
  "noble",
  "peppy",
  "perky",
  "plucky",
  "polite",
  "proud",
  "quick",
  "quiet",
  "rapid",
  "rosy",
  "rusty",
  "shiny",
  "silly",
  "sleepy",
  "smooth",
  "snappy",
  "snowy",
  "solar",
  "spicy",
  "spry",
  "steady",
  "sunny",
  "super",
  "swift",
  "tidy",
  "tiny",
  "upbeat",
  "velvet",
  "vivid",
  "wacky",
  "witty",
  "wild",
  "windy",
  "wise",
  "zany",
  "zesty",
  "zippy",
];

const ANIMALS = [
  "alpaca",
  "badger",
  "beaver",
  "bison",
  "bobcat",
  "camel",
  "cheetah",
  "cobra",
  "condor",
  "coyote",
  "crane",
  "dingo",
  "dolphin",
  "donkey",
  "eagle",
  "falcon",
  "ferret",
  "finch",
  "gazelle",
  "gecko",
  "gibbon",
  "giraffe",
  "goose",
  "gopher",
  "heron",
  "hippo",
  "hyena",
  "ibex",
  "iguana",
  "impala",
  "jackal",
  "jaguar",
  "koala",
  "lemur",
  "leopard",
  "llama",
  "lobster",
  "lynx",
  "magpie",
  "marmot",
  "meerkat",
  "mink",
  "moose",
  "narwhal",
  "newt",
  "ocelot",
  "octopus",
  "orca",
  "osprey",
  "otter",
  "owl",
  "panda",
  "parrot",
  "pelican",
  "penguin",
  "puffin",
  "quail",
  "rabbit",
  "raccoon",
  "raven",
  "salmon",
  "seal",
  "shark",
  "sloth",
  "spider",
  "squid",
  "stork",
  "swan",
  "tapir",
  "tiger",
  "toucan",
  "turtle",
  "walrus",
  "weasel",
  "whale",
  "wombat",
  "wolf",
  "yak",
  "zebra",
  "zorilla",
];

/** The number at the end of a random Room ID is below this. */
const NUMBER_LIMIT = 100;

/** How many different Room IDs `randomRoomId` can make up. */
export const RANDOM_ROOM_ID_COUNT =
  new Set(ADJECTIVES).size * new Set(ANIMALS).size * NUMBER_LIMIT;

/** A random whole number from 0 to `below - 1`, from the browser's or Node's crypto. */
function cryptoRandomBelow(below: number): number {
  // The modulo bias is under one in ten million for ranges this small.
  return crypto.getRandomValues(new Uint32Array(1))[0]! % below;
}

/**
 * Makes up a new Room ID such as `brave-otter-42`, hard to guess. It always passes `parseRoomId`
 * unchanged. `randomBelow` picks each part, and is only replaced in tests.
 */
export function randomRoomId(
  randomBelow: (below: number) => number = cryptoRandomBelow,
): RoomId {
  const adjective = ADJECTIVES[randomBelow(ADJECTIVES.length)];
  const animal = ANIMALS[randomBelow(ANIMALS.length)];
  return `${adjective}-${animal}-${randomBelow(NUMBER_LIMIT)}`;
}
