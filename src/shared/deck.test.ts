import { describe, expect, it } from "vitest";
import { parseDeck } from "./deck.js";

describe("reading a typed Deck", () => {
  it("takes Cards separated by commas, spaces or both, sorted and without duplicates", () => {
    expect(parseDeck(" 8, 3 1,,5\n3 ")).toEqual({
      ok: true,
      deck: [1, 3, 5, 8],
      notCards: [],
    });
  });

  it("points out every word that isn't a whole number from 1 to 99", () => {
    expect(parseDeck("1 0 2.5 -3 100 abc 1e1 4")).toEqual({
      ok: false,
      reason: "not-a-card",
      notCards: ["0", "2.5", "-3", "100", "abc", "1e1"],
    });
  });

  it("accepts 1 and 99, the ends of the range", () => {
    expect(parseDeck("1, 99")).toMatchObject({ ok: true, deck: [1, 99] });
  });

  it("needs at least 2 different Cards and at most 15", () => {
    expect(parseDeck("")).toMatchObject({ ok: false, reason: "too-few-cards" });
    expect(parseDeck("5 5")).toMatchObject({
      ok: false,
      reason: "too-few-cards",
    });
    expect(parseDeck("1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16")).toMatchObject({
      ok: false,
      reason: "too-many-cards",
    });
  });
});
