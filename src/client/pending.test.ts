import { describe, expect, it } from "vitest";
import type { ParticipantView, RoomSnapshot } from "../shared/protocol.js";
import {
  findParticipant,
  settlePendingCommand,
  settlePendingGhost,
  withPending,
} from "./pending.js";
import { createRoom } from "../server/room.js";
import type { Skin } from "../shared/ghost.js";

const noFacilitator: RoomSnapshot = {
  participants: [],
  myVote: null,
  hasFacilitator: false,
  round: 3,
  revealed: false,
  result: null,
  deck: [1, 2, 3],
  autoReveal: true,
  countingDown: false,
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

describe("your own Ghost, before the Room answers", () => {
  const coral = { fabric: "coral-stripes", disguise: "none" } as const;
  const berryNinja = { fabric: "berry-gingham", disguise: "ninja" } as const;
  const somewhere = { x: 0.2, y: 0.8 };
  /** Your Ghost as you asked for it, in a Skin, with the roll a summon would send. */
  const wearing = (skin: Skin) => ({ skin, roll: 0.5 });

  function person(
    id: string,
    overrides: Partial<ParticipantView> = {},
  ): ParticipantView {
    return {
      id,
      name: id,
      role: "observer",
      isFacilitator: false,
      hasVoted: false,
      vote: null,
      connected: true,
      ghost: null,
      ...overrides,
    };
  }

  /** Ana is a Voter; Davi (you) and Eva are Observers. */
  function room(
    davi: Partial<ParticipantView> = {},
    eva: Partial<ParticipantView> = {},
  ) {
    return {
      ...noFacilitator,
      participants: [
        person("ana", { role: "voter" }),
        person("davi", davi),
        person("eva", eva),
      ],
    };
  }
  const shown = (snapshot: RoomSnapshot, id: string) =>
    findParticipant(snapshot, id)?.ghost;

  it("appears at once in the Skin you picked, at the vent the Room will put it", () => {
    // The Room, with Ana voting, Eva's Ghost out, and Davi about to summon his.
    const theRoom = createRoom();
    theRoom.join("ana", "Ana");
    theRoom.join("davi", "Davi");
    theRoom.becomeObserver("davi");
    theRoom.join("eva", "Eva");
    theRoom.becomeObserver("eva");
    theRoom.summonGhost("eva", coral);
    const before = theRoom.snapshotFor("davi");

    const summon = { skin: berryNinja, roll: 0.42 };
    const predicted = withPending(before, "davi", null, null, summon);
    theRoom.summonGhost("davi", berryNinja, summon.roll);

    expect(shown(predicted, "davi")).toEqual(
      shown(theRoom.snapshotFor("davi"), "davi"),
    );
  });

  it("is re-dressed at once, where it stands", () => {
    const displayed = withPending(
      room({ ghost: { skin: coral, to: somewhere } }),
      "davi",
      null,
      null,
      wearing(berryNinja),
    );
    expect(shown(displayed, "davi")).toEqual({
      skin: berryNinja,
      to: somewhere,
    });
  });

  it("goes at once when you put it away", () => {
    const displayed = withPending(
      room({ ghost: { skin: coral, to: somewhere } }),
      "davi",
      null,
      null,
      "away",
    );
    expect(shown(displayed, "davi")).toBeNull();
  });

  it("goes at once when you become a Voter", () => {
    const displayed = withPending(
      room({ ghost: { skin: coral, to: somewhere } }),
      "davi",
      null,
      "voter",
      null,
    );
    expect(shown(displayed, "davi")).toBeNull();
  });

  it("changes nobody else's Ghost", () => {
    const eva = { ghost: { skin: coral, to: somewhere } };
    const displayed = withPending(
      room({}, eva),
      "davi",
      null,
      null,
      wearing(berryNinja),
    );
    expect(shown(displayed, "eva")).toEqual(eva.ghost);
  });

  it("stays pending until the Room shows it, even through snapshots that predate it", () => {
    expect(settlePendingGhost(wearing(berryNinja), room(), "davi")).toEqual(
      wearing(berryNinja),
    );
    expect(
      settlePendingGhost(
        wearing(berryNinja),
        room({ ghost: { skin: coral, to: somewhere } }),
        "davi",
      ),
    ).toEqual(wearing(berryNinja));
    expect(
      settlePendingGhost(
        wearing(berryNinja),
        room({ ghost: { skin: berryNinja, to: somewhere } }),
        "davi",
      ),
    ).toBeNull();
  });

  it("stays pending away until the Room shows it gone", () => {
    const out = room({ ghost: { skin: coral, to: somewhere } });
    expect(settlePendingGhost("away", out, "davi")).toBe("away");
    expect(settlePendingGhost("away", room(), "davi")).toBeNull();
  });

  it("is dropped once you're no longer an Observer in the Room", () => {
    expect(
      settlePendingGhost(wearing(coral), room({ role: "voter" }), "davi"),
    ).toBeNull();
    expect(
      settlePendingGhost(
        wearing(coral),
        { ...noFacilitator, participants: [] },
        "davi",
      ),
    ).toBeNull();
  });
});
