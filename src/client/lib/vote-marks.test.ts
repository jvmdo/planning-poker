import { describe, expect, it } from "vitest";
import type { ParticipantView, RoomSnapshot } from "../../shared/protocol.js";
import { keepReading } from "./vote-marks.js";

function voter(name: string, vote: number | null): ParticipantView {
  return {
    id: name,
    name,
    role: "voter",
    isFacilitator: false,
    hasVoted: vote !== null,
    vote,
    connected: true,
  };
}

/** Ana, Bruno and Carla on 8h, Davi on 16h and Eva on 32h: Davi and Eva are Outliers. */
const revealed: RoomSnapshot = {
  participants: [
    voter("Ana", 8),
    voter("Bruno", 8),
    voter("Carla", 8),
    voter("Davi", 16),
    voter("Eva", 32),
  ],
  myVote: 8,
  hasFacilitator: true,
  round: 3,
  revealed: true,
  result: 14.4,
  deck: [1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64],
  autoReveal: true,
  revealCountdown: false,
};

describe("the reading of a Round", () => {
  it("is nothing before the Reveal", () => {
    expect(keepReading(null, { ...revealed, revealed: false })).toBeNull();
  });

  it("is taken at the Reveal, with the Outliers' names", () => {
    const kept = keepReading(null, revealed);
    expect(kept?.round).toBe(3);
    expect(kept?.reading.outlierNames).toEqual(["Davi", "Eva"]);
    expect(kept?.reading.markOf("Eva")).toBe("outlier");
    expect(kept?.reading.markOfCard(16)).toBe("outlier");
    expect(kept?.reading.markOf("Ana")).toBeNull();
  });

  it("stays as it was when an Outlier leaves after the Reveal", () => {
    const kept = keepReading(null, revealed);
    const evaLeft = {
      ...revealed,
      participants: revealed.participants.filter((p) => p.name !== "Eva"),
    };
    expect(keepReading(kept, evaLeft)).toBe(kept);
  });

  it("stays as it was when a Voter turns Observer after the Reveal", () => {
    const kept = keepReading(null, revealed);
    const daviObserves = {
      ...revealed,
      participants: revealed.participants.map((p) =>
        p.name === "Davi" ? { ...p, role: "observer" as const } : p,
      ),
    };
    expect(keepReading(kept, daviObserves)).toBe(kept);
  });

  it("is read again when a Vote comes back after the Reveal, keeping those who left", () => {
    // Fábio's phone slept through the Reveal; Eva leaves after it.
    const kept = keepReading(null, revealed);
    const fabioBack = {
      ...revealed,
      participants: [
        ...revealed.participants.filter((p) => p.name !== "Eva"),
        voter("Fábio", 64),
      ],
    };

    const next = keepReading(kept, fabioBack);

    expect(next).not.toBe(kept);
    expect(next?.reading.outlierNames).toEqual(["Davi", "Eva", "Fábio"]);
    expect(next?.reading.markOf("Fábio")).toBe("outlier");
    expect(keepReading(next, fabioBack)).toBe(next);
  });

  it("is dropped when the next Round starts", () => {
    const kept = keepReading(null, revealed);
    const next = {
      ...revealed,
      round: 4,
      revealed: false,
      participants: revealed.participants.map((p) => voter(p.name, null)),
    };
    expect(keepReading(kept, next)).toBeNull();
  });

  it("is taken again at the next Reveal", () => {
    const kept = keepReading(null, revealed);
    const nextReveal = {
      ...revealed,
      round: 4,
      participants: revealed.participants.map((p) => voter(p.name, 8)),
    };
    const next = keepReading(kept, nextReveal);
    expect(next?.round).toBe(4);
    expect(next?.reading.agreement).toEqual({ kind: "everyone-agrees" });
  });
});
