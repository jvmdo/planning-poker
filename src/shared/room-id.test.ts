import { describe, expect, it } from "vitest";
import {
  MAX_ROOM_ID_LENGTH,
  parseRoomId,
  RANDOM_ROOM_ID_COUNT,
  randomRoomId,
} from "./room-id.js";

describe("reading a Room ID", () => {
  it("takes lowercase letters, digits and dashes", () => {
    expect(parseRoomId("team-alpha-2")).toBe("team-alpha-2");
  });

  it("converts uppercase to lowercase, so /Team-Alpha is the Room team-alpha", () => {
    expect(parseRoomId("Team-ALPHA")).toBe("team-alpha");
  });

  it("is 1 to 40 characters long", () => {
    expect(MAX_ROOM_ID_LENGTH).toBe(40);
    expect(parseRoomId("")).toBeNull();
    expect(parseRoomId("a")).toBe("a");
    expect(parseRoomId("a".repeat(40))).toBe("a".repeat(40));
    expect(parseRoomId("a".repeat(41))).toBeNull();
  });

  it("refuses dots, so a Room ID never looks like a static file", () => {
    expect(parseRoomId("logo.svg")).toBeNull();
    expect(parseRoomId(".")).toBeNull();
  });

  it("refuses every other character", () => {
    for (const id of [
      "team alpha",
      "team_alpha",
      "team/alpha",
      "çà",
      "a?b",
      "a%20b",
    ]) {
      expect(parseRoomId(id)).toBeNull();
    }
  });

  it("refuses letters that only become a–z in lowercase", () => {
    // The Kelvin sign lowercases to "k".
    expect(parseRoomId("\u212Aelvin")).toBeNull();
  });

  it("refuses anything that isn't a string", () => {
    expect(parseRoomId(undefined)).toBeNull();
    expect(parseRoomId(["team-alpha"])).toBeNull();
    expect(parseRoomId(42)).toBeNull();
  });
});

describe("a random Room ID", () => {
  it("is word-word-number, as in brave-otter-42", () => {
    for (let i = 0; i < 1000; i++) {
      expect(randomRoomId()).toMatch(/^[a-z]+-[a-z]+-\d{1,2}$/);
    }
  });

  it("always passes the Room ID check, unchanged", () => {
    for (let i = 0; i < 1000; i++) {
      const id = randomRoomId();
      expect(parseRoomId(id)).toBe(id);
    }
  });

  it("is one of a few hundred thousand, so it's hard to guess", () => {
    expect(RANDOM_ROOM_ID_COUNT).toBeGreaterThanOrEqual(300_000);
  });

  it("takes every part from the random numbers it's given", () => {
    // Always the first choice, then always the last.
    expect(randomRoomId(() => 0)).toMatch(/^[a-z]+-[a-z]+-0$/);
    expect(randomRoomId((n) => n - 1)).toMatch(/^[a-z]+-[a-z]+-99$/);
  });

  it("varies", () => {
    const ids = new Set(Array.from({ length: 100 }, () => randomRoomId()));
    expect(ids.size).toBeGreaterThan(95);
  });
});
