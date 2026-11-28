import { describe, expect, it } from "vitest";
import type { ParticipantView } from "../../shared/protocol.js";
import { seatLayout, type SeatLayout } from "./seat-layout.js";

function participant(
  name: string,
  role: ParticipantView["role"] = "voter",
): ParticipantView {
  return {
    id: name,
    name,
    role,
    isFacilitator: false,
    hasVoted: false,
    vote: null,
    connected: true,
    ghost: null,
  };
}

/** Where each seat sits, by name, rounded so the trigonometry compares cleanly. */
function placesOf(layout: SeatLayout) {
  return layout.seats.map((seat) => [
    seat.participant.name,
    Math.round(seat.x * 1000) / 1000,
    Math.round(seat.y * 1000) / 1000,
  ]);
}

describe("the seat layout", () => {
  it("puts your seat at the bottom of the Table", () => {
    const participants = [
      participant("Ana"),
      participant("Bruno"),
      participant("Carla"),
    ];

    const [first] = placesOf(seatLayout(participants, "Bruno"));

    expect(first).toEqual(["Bruno", 0.5, 1]);
  });

  it("goes on clockwise in Room order after yours, evenly spaced, wrapping round to the first Voter", () => {
    const participants = ["Ana", "Bruno", "Carla", "Davi"].map((n) =>
      participant(n),
    );

    const layout = seatLayout(participants, "Carla");

    expect(placesOf(layout)).toEqual([
      ["Carla", 0.5, 1],
      ["Davi", 0, 0.5],
      ["Ana", 0.5, 0],
      ["Bruno", 1, 0.5],
    ]);
  });

  it("turns the Table back by one seat-step for each seat before yours", () => {
    const participants = ["Ana", "Bruno", "Carla", "Davi"].map((n) =>
      participant(n),
    );

    expect(seatLayout(participants, "Ana").turn).toBeCloseTo(0);
    expect(seatLayout(participants, "Bruno").turn).toBeCloseTo(-Math.PI / 2);
    expect(seatLayout(participants, "Davi").turn).toBeCloseTo(
      (-3 * Math.PI) / 2,
    );
  });

  it("seats only Voters, and shows an Observer the Room order unturned, the first Voter at the bottom", () => {
    const participants = [
      participant("Eva", "observer"),
      participant("Ana"),
      participant("Bruno"),
      participant("Fábio", "observer"),
      participant("Carla"),
      participant("Davi"),
    ];

    const layout = seatLayout(participants, "Eva");

    expect(layout.turn).toBeCloseTo(0);
    expect(placesOf(layout)).toEqual([
      ["Ana", 0.5, 1],
      ["Bruno", 0, 0.5],
      ["Carla", 0.5, 0],
      ["Davi", 1, 0.5],
    ]);
  });

  it("is empty and unturned with no Voters", () => {
    const layout = seatLayout([participant("Eva", "observer")], "Eva");

    expect(layout.seats).toEqual([]);
    expect(layout.turn).toBe(0);
  });
});
