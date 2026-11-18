import { describe, expect, it } from "vitest";
import { MAX_ROOM_ID_LENGTH, parseRoomId } from "./room-id.js";

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
