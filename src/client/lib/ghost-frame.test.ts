import { describe, expect, it } from "vitest";
import type { ParticipantView } from "../../shared/protocol.js";
import {
  screenToTable,
  tableToScreen,
  type RoomBounds,
} from "./ghost-frame.js";
import { seatLayout } from "./seat-layout.js";

function voter(name: string): ParticipantView {
  return {
    id: name,
    name,
    role: "voter",
    isFacilitator: false,
    hasVoted: false,
    vote: null,
    connected: true,
    ghost: null,
  };
}

/** A room area roomy enough that nothing in these tests is clamped. */
const ROOMY: RoomBounds = { left: -1, top: -1, right: 2, bottom: 2 };

describe("the Ghost frame", () => {
  it.each([2, 3, 5, 8])(
    "puts a Ghost over seat i on the shared Table over seat i on every Voter's screen, with %i Voters",
    (count) => {
      const voters = Array.from({ length: count }, (_, i) => voter(`v${i}`));
      // On the shared Table, as an Observer sees it.
      const shared = seatLayout(voters, "an-observer").seats;

      for (const viewer of voters) {
        const { seats, turn } = seatLayout(voters, viewer.id);
        for (const seat of seats) {
          const onShared = shared.find(
            (s) => s.participant.id === seat.participant.id,
          );
          const onScreen = tableToScreen(onShared ?? seat, turn, ROOMY);
          expect(onScreen.x).toBeCloseTo(seat.x);
          expect(onScreen.y).toBeCloseTo(seat.y);
        }
      }
    },
  );

  it("shows an Observer the shared Table as it is", () => {
    expect(tableToScreen({ x: 0.2, y: 1.3 }, 0, ROOMY)).toEqual({
      x: 0.2,
      y: 1.3,
    });
  });

  it("turns the middle of the Table nowhere", () => {
    const point = tableToScreen({ x: 0.5, y: 0.5 }, 2, ROOMY);
    expect(point.x).toBeCloseTo(0.5);
    expect(point.y).toBeCloseTo(0.5);
  });

  it.each([
    [{ x: 0.1, y: 0.3 }, 0],
    [{ x: 0.9, y: 0.05 }, -Math.PI / 3],
    [{ x: -0.2, y: 1.1 }, (-4 * Math.PI) / 5],
    [{ x: 0.5, y: 1.2 }, -Math.PI],
  ])("gives back %o when converted to the screen and back", (point, turn) => {
    const back = screenToTable(tableToScreen(point, turn, ROOMY), turn);
    expect(back.x).toBeCloseTo(point.x);
    expect(back.y).toBeCloseTo(point.y);
  });

  it("keeps a point inside this screen's room area", () => {
    const tight: RoomBounds = {
      left: -0.1,
      top: -0.15,
      right: 1.1,
      bottom: 1.05,
    };

    expect(tableToScreen({ x: -0.5, y: 1.5 }, 0, tight)).toEqual({
      x: -0.1,
      y: 1.05,
    });
    expect(tableToScreen({ x: 1.4, y: -0.4 }, 0, tight)).toEqual({
      x: 1.1,
      y: -0.15,
    });
    expect(tableToScreen({ x: 0.3, y: 0.6 }, 0, tight)).toEqual({
      x: 0.3,
      y: 0.6,
    });
  });

  it("keeps a turned point far out at the edge inside the room area too", () => {
    const tight: RoomBounds = {
      left: -0.1,
      top: -0.1,
      right: 1.1,
      bottom: 1.1,
    };

    const point = tableToScreen({ x: -0.5, y: -0.5 }, -Math.PI / 4, tight);

    expect(point.x).toBeGreaterThanOrEqual(-0.1);
    expect(point.x).toBeLessThanOrEqual(1.1);
    expect(point.y).toBeGreaterThanOrEqual(-0.1);
    expect(point.y).toBeLessThanOrEqual(1.1);
  });

  it("brings a screen point that turns out of reach back within reach of the shared Table", () => {
    // A corner of the room area, turned an eighth of the way round, is further out than any edge.
    const point = screenToTable({ x: -0.95, y: -0.95 }, -Math.PI / 4);

    expect(point.x).toBeGreaterThanOrEqual(-1);
    expect(point.y).toBeGreaterThanOrEqual(-1);
    expect(point.x).toBeLessThanOrEqual(2);
    expect(point.y).toBeLessThanOrEqual(2);
  });
});
