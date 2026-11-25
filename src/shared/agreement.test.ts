import { describe, expect, it } from "vitest";
import { agreementOf } from "./agreement.js";
import { DEFAULT_DECK, type Card } from "./deck.js";

/** Votes as `[Card, count]` pairs, each Voter named after their Card and place: "8a", "8b"… */
function votes(...groups: [Card, number][]) {
  return groups.flatMap(([card, count]) =>
    Array.from({ length: count }, (_, i) => ({
      id: `${card}${String.fromCharCode(97 + i)}`,
      vote: card,
    })),
  );
}

const read = (...groups: [Card, number][]) =>
  agreementOf(votes(...groups), DEFAULT_DECK);

describe("reading the Votes after the Reveal", () => {
  it("says nothing about fewer than two Votes", () => {
    expect(agreementOf([], DEFAULT_DECK)).toEqual({ kind: "too-few" });
    expect(read([8, 1])).toEqual({ kind: "too-few" });
  });

  it("sees everyone agree when every Vote is the same Card", () => {
    expect(read([8, 6])).toEqual({ kind: "everyone-agrees" });
  });

  describe("nearly everyone agrees when every Vote is within one Card of the same Card", () => {
    it("with one Vote next to the majority", () => {
      expect(read([8, 6], [6, 1])).toEqual({ kind: "nearly-agrees" });
    });

    it("with Votes either side of a Card", () => {
      expect(read([6, 2], [8, 2], [10, 1])).toEqual({ kind: "nearly-agrees" });
    });

    it("with two Voters next to each other", () => {
      expect(read([6, 1], [8, 1])).toEqual({ kind: "nearly-agrees" });
    });

    it("with two camps next to each other", () => {
      expect(read([6, 3], [8, 3])).toEqual({ kind: "nearly-agrees" });
    });
  });

  describe("names as Outliers every Voter two or more Cards from a Card with half the Votes", () => {
    it("on one side, lowest Vote first", () => {
      expect(read([8, 3], [16, 1], [32, 1])).toEqual({
        kind: "outliers",
        outliers: ["16a", "32a"],
      });
    });

    it("on both sides, however many, when the majority has exactly half", () => {
      expect(read([8, 3], [12, 2], [1, 1])).toEqual({
        kind: "outliers",
        outliers: ["1a", "12a", "12b"],
      });
    });

    it("but not the Voters next to the majority", () => {
      expect(read([8, 3], [6, 1], [10, 1], [24, 1])).toEqual({
        kind: "outliers",
        outliers: ["24a"],
      });
    });

    it("even when every Vote is within one Card of another Card", () => {
      // 12 is next to 10, which is next to 8, but two Cards from the majority.
      expect(read([8, 5], [12, 1])).toEqual({
        kind: "outliers",
        outliers: ["12a"],
      });
      expect(read([10, 5], [8, 1], [6, 1])).toEqual({
        kind: "outliers",
        outliers: ["6a"],
      });
    });

    it("when the majority is the lowest Card played", () => {
      expect(read([2, 2], [8, 1], [32, 1])).toEqual({
        kind: "outliers",
        outliers: ["8a", "32a"],
      });
    });
  });

  describe("sees a Split when two Cards tie for most and every other Vote is next to one", () => {
    it("with nothing else played", () => {
      expect(read([4, 3], [8, 3])).toEqual({ kind: "split", camps: [4, 8] });
    });

    it("with a Vote between the camps", () => {
      expect(read([4, 3], [6, 1], [8, 3])).toEqual({
        kind: "split",
        camps: [4, 8],
      });
    });
  });

  describe("finds no consensus otherwise", () => {
    it("when a tie has a Vote far from both camps", () => {
      expect(read([4, 2], [16, 2], [64, 1])).toEqual({
        kind: "no-consensus",
        lowest: 4,
        highest: 64,
      });
    });

    it("when the most played Card has under half the Votes", () => {
      expect(read([8, 2], [24, 1], [32, 1], [64, 1])).toEqual({
        kind: "no-consensus",
        lowest: 8,
        highest: 64,
      });
    });

    it("when every Vote is a different Card", () => {
      expect(read([1, 1], [4, 1], [8, 1], [16, 1], [64, 1])).toEqual({
        kind: "no-consensus",
        lowest: 1,
        highest: 64,
      });
    });

    it("when three Cards tie for most", () => {
      expect(read([1, 2], [8, 2], [64, 2])).toEqual({
        kind: "no-consensus",
        lowest: 1,
        highest: 64,
      });
    });
  });

  it("counts steps in the Room's own Deck", () => {
    // 3 and 5 are next to each other here, though two apart in hours.
    expect(agreementOf(votes([3, 3], [5, 1]), [1, 3, 5, 8, 13])).toEqual({
      kind: "nearly-agrees",
    });
    // 1 and 3 are two Cards apart here, though only two hours apart.
    expect(agreementOf(votes([1, 3], [3, 1]), [1, 2, 3, 4, 5])).toEqual({
      kind: "outliers",
      outliers: ["3a"],
    });
  });
});
