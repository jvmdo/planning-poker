import { describe, expect, it } from "vitest";
import {
  addNudge,
  burstNotice,
  nudgeStrength,
  shakeOf,
  type NudgeBurst,
} from "./nudge-burst.js";

const NAMES: Record<string, string> = {
  ana: "Ana",
  bruno: "Bruno",
  caio: "Caio",
  dora: "Dora",
  eva: "Eva",
  fabio: "Fábio",
};
const nameOf = (id: string) => NAMES[id] ?? "Someone";

/** The burst of Nudges at Bruno from these senders, in order, each at the level the Room sent. */
function burstFrom(...senders: [string, number][]): NudgeBurst {
  let burst: NudgeBurst | null = null;
  for (const [from, level] of senders)
    burst = addNudge(burst, { from, to: "bruno", level });
  if (!burst) throw new Error("a burst needs a Nudge");
  return burst;
}

describe("merging a burst of Nudges", () => {
  it("starts with the first Nudge", () => {
    expect(burstFrom(["ana", 1])).toEqual({
      to: "bruno",
      from: ["ana"],
      level: 1,
    });
  });

  it("collects each sender once, in order, at the highest level", () => {
    expect(burstFrom(["ana", 1], ["caio", 2], ["ana", 2], ["dora", 3])).toEqual(
      {
        to: "bruno",
        from: ["ana", "caio", "dora"],
        level: 3,
      },
    );
  });

  it("never drops to a lower level", () => {
    expect(burstFrom(["ana", 3], ["caio", 2]).level).toBe(3);
  });

  it("starts again for a Nudge at someone else", () => {
    const burst = addNudge(burstFrom(["ana", 2]), {
      from: "caio",
      to: "dora",
      level: 1,
    });
    expect(burst).toEqual({ to: "dora", from: ["caio"], level: 1 });
  });
});

describe("the toast for a burst", () => {
  const noticeFor = (viewer: string, burst: NudgeBurst) =>
    burstNotice(burst, viewer, nameOf);

  describe("for the Holdout", () => {
    it("names one sender", () => {
      expect(noticeFor("bruno", burstFrom(["ana", 1]))).toBe(
        "Ana sent you a Nudge!",
      );
    });

    it("names two senders", () => {
      expect(noticeFor("bruno", burstFrom(["ana", 1], ["caio", 2]))).toBe(
        "Ana and Caio sent you a Nudge!",
      );
    });

    it("names the first two, and counts the others", () => {
      expect(
        noticeFor(
          "bruno",
          burstFrom(
            ["ana", 1],
            ["caio", 2],
            ["dora", 3],
            ["eva", 4],
            ["fabio", 5],
          ),
        ),
      ).toBe("Ana, Caio and 3 others sent you a Nudge!");
      expect(
        noticeFor("bruno", burstFrom(["ana", 1], ["caio", 2], ["dora", 3])),
      ).toBe("Ana, Caio and 1 other sent you a Nudge!");
    });
  });

  describe("for everyone else", () => {
    it("names one sender", () => {
      expect(noticeFor("eva", burstFrom(["ana", 1]))).toBe("Ana Nudged Bruno");
    });

    it("names two senders", () => {
      expect(noticeFor("eva", burstFrom(["ana", 1], ["caio", 2]))).toBe(
        "Ana and Caio Nudged Bruno",
      );
    });

    it("names the first two, and counts the others", () => {
      expect(
        noticeFor(
          "eva",
          burstFrom(["ana", 1], ["caio", 2], ["dora", 3], ["fabio", 4]),
        ),
      ).toBe("Ana, Caio and 2 others Nudged Bruno");
    });
  });

  describe("for a sender", () => {
    it("says you Nudged them", () => {
      expect(noticeFor("ana", burstFrom(["ana", 1]))).toBe("You Nudged Bruno");
    });

    it("names you first among the senders", () => {
      expect(noticeFor("caio", burstFrom(["ana", 1], ["caio", 2]))).toBe(
        "You and Ana Nudged Bruno",
      );
      expect(
        noticeFor("dora", burstFrom(["ana", 1], ["caio", 2], ["dora", 3])),
      ).toBe("You, Ana and 1 other Nudged Bruno");
    });
  });
});

describe("a Nudge's strength", () => {
  it("goes from nothing at level 1 to full at the top level", () => {
    expect([1, 2, 3, 4, 5].map(nudgeStrength)).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(nudgeStrength(9)).toBe(1);
  });
});

describe("the Holdout's shake", () => {
  it("grows longer and stronger with each level, from 0.5 s to 1.5 s", () => {
    const shakes = [1, 2, 3, 4, 5].map(shakeOf);
    expect(shakes[0]?.ms).toBe(500);
    expect(shakes[4]?.ms).toBe(1500);
    for (let i = 1; i < shakes.length; i++) {
      expect(shakes[i]!.ms).toBeGreaterThan(shakes[i - 1]!.ms);
      expect(shakes[i]!.px).toBeGreaterThan(shakes[i - 1]!.px);
    }
  });

  it("shakes no harder past the top level", () => {
    expect(shakeOf(9)).toEqual(shakeOf(5));
  });
});
