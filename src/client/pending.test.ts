import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "../shared/protocol.js";
import { settlePendingCommand } from "./pending.js";

const noFacilitator: RoomSnapshot = {
  participants: [],
  myVote: null,
  hasFacilitator: false,
  round: 3,
  revealed: false,
  result: null,
  deck: [1, 2, 3],
  autoReveal: true,
  revealCountdown: false,
};

describe("a pending claim of the Facilitator role", () => {
  const claim = { command: "claimFacilitator", fromRound: 3 } as const;

  it("stays while the Room still has no Facilitator", () => {
    expect(settlePendingCommand(claim, noFacilitator)).toEqual(claim);
  });

  it("is answered once anyone is the Facilitator, whoever won", () => {
    expect(
      settlePendingCommand(claim, { ...noFacilitator, hasFacilitator: true }),
    ).toBeNull();
  });
});

describe("a pending change to Auto Reveal", () => {
  const turnOff = {
    command: "setAutoReveal",
    fromRound: 3,
    on: false,
  } as const;

  it("stays while the Room still has Auto Reveal on", () => {
    expect(settlePendingCommand(turnOff, noFacilitator)).toEqual(turnOff);
  });

  it("is answered once the Room has Auto Reveal off", () => {
    expect(
      settlePendingCommand(turnOff, { ...noFacilitator, autoReveal: false }),
    ).toBeNull();
  });
});
