import { describe, expect, it, vi } from "vitest";
import type { ParticipantView } from "../shared/protocol.js";
import { createRoom } from "./room.js";

/** How a Participant appears in anyone's snapshot, unless the test says otherwise. */
function participant(
  id: string,
  name: string,
  overrides: Partial<ParticipantView> = {},
): ParticipantView {
  return {
    id,
    name,
    role: "voter",
    isFacilitator: false,
    hasVoted: false,
    vote: null,
    ...overrides,
  };
}

describe("joining the Room", () => {
  it("lists a Participant who joins, as a Voter", () => {
    const room = createRoom();

    expect(room.join("ana-id", "Ana")).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
    ]);
  });
});

describe("the Facilitator", () => {
  it("is the first Participant to join an empty Room, as seen by everyone", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");

    const expected = [
      participant("ana-id", "Ana", { isFacilitator: true }),
      participant("bruno-id", "Bruno"),
    ];
    expect(room.snapshotFor("ana-id").participants).toEqual(expected);
    expect(room.snapshotFor("bruno-id").participants).toEqual(expected);
  });
});

describe("display names", () => {
  it("rejects a name already used by a present Participant, ignoring case and surrounding spaces", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.join("other-id", "  aNA ")).toEqual({
      ok: false,
      reason: "name-taken",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("drops the spaces around a name", () => {
    const room = createRoom();
    room.join("ana-id", "  Ana  ");

    expect(room.snapshotFor("ana-id").participants.map((p) => p.name)).toEqual([
      "Ana",
    ]);
  });

  it("rejects a blank name and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.join("other-id", "   ")).toEqual({
      ok: false,
      reason: "name-empty",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("accepts the same Participant rejoining with their own name, without listing them twice", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");

    expect(room.join("ana-id", "ana")).toEqual({ ok: true });

    expect(room.snapshotFor("bruno-id").participants).toEqual([
      participant("ana-id", "ana", { isFacilitator: true }),
      participant("bruno-id", "Bruno"),
    ]);
  });
});

describe("change notifications", () => {
  it("tells subscribers after a Participant joins, but not after a rejected command", () => {
    const room = createRoom();
    const onChange = vi.fn();
    room.subscribe(onChange);

    room.join("ana-id", "Ana");
    expect(onChange).toHaveBeenCalledTimes(1);

    room.join("other-id", "ANA");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("stops telling a subscriber once they unsubscribe", () => {
    const room = createRoom();
    const onChange = vi.fn();
    const unsubscribe = room.subscribe(onChange);

    unsubscribe();
    room.join("ana-id", "Ana");

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("voting", () => {
  it("records a Voter's Vote and shows it back to them", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");

    expect(room.vote("ana-id", 8)).toEqual({ ok: true });

    const snapshot = room.snapshotFor("ana-id");
    expect(snapshot.myVote).toBe(8);
    expect(snapshot.participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true, hasVoted: true }),
    ]);
  });

  it("lets a Voter change their Vote as often as they like", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);

    expect(room.vote("ana-id", 32)).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").myVote).toBe(32);
  });

  it("shows everyone who has voted, and who hasn't", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 8);

    const voted = room
      .snapshotFor("bruno-id")
      .participants.map((p) => [p.name, p.hasVoted]);
    expect(voted).toEqual([
      ["Ana", true],
      ["Bruno", false],
    ]);
  });

  it("never puts another Participant's Vote anywhere in a snapshot before the Reveal", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 64);
    room.vote("bruno-id", 32);

    const anaSees = JSON.stringify(room.snapshotFor("ana-id"));
    const brunoSees = JSON.stringify(room.snapshotFor("bruno-id"));
    expect(anaSees).toContain("64");
    expect(anaSees).not.toContain("32");
    expect(brunoSees).toContain("32");
    expect(brunoSees).not.toContain("64");
  });

  it("rejects a value that isn't a Card in the Deck and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);
    const before = room.snapshotFor("ana-id");

    expect(room.vote("ana-id", 3)).toEqual({
      ok: false,
      reason: "card-not-in-deck",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("rejects a Vote from someone who isn't in the Room and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.vote("stranger-id", 8)).toEqual({
      ok: false,
      reason: "not-in-room",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
    expect(room.snapshotFor("stranger-id").myVote).toBeNull();
  });

  it("lets a Participant who joins mid-Round vote in the current Round", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);

    room.join("bruno-id", "Bruno");
    expect(room.vote("bruno-id", 4)).toEqual({ ok: true });

    expect(
      room.snapshotFor("ana-id").participants.every((p) => p.hasVoted),
    ).toBe(true);
    expect(room.snapshotFor("ana-id").myVote).toBe(8);
    expect(room.snapshotFor("bruno-id").myVote).toBe(4);
  });
});

describe("the Reveal", () => {
  it("shows everyone every Vote and the Result, even when not everyone has voted", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.vote("ana-id", 8);
    room.vote("bruno-id", 16);

    expect(room.reveal("ana-id")).toEqual({ ok: true });

    for (const id of ["ana-id", "bruno-id", "carla-id"]) {
      const snapshot = room.snapshotFor(id);
      expect(snapshot.revealed).toBe(true);
      expect(snapshot.result).toBe(12);
      expect(snapshot.participants.map((p) => [p.name, p.vote])).toEqual([
        ["Ana", 8],
        ["Bruno", 16],
        ["Carla", null],
      ]);
    }
  });

  it("rounds the Result to one decimal place", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.vote("ana-id", 1);
    room.vote("bruno-id", 2);
    room.vote("carla-id", 4);

    room.reveal("ana-id");

    expect(room.snapshotFor("bruno-id").result).toBe(2.3);
  });

  it("rejects a Reveal from anyone but the Facilitator and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 8);
    const before = room.snapshotFor("bruno-id");

    expect(room.reveal("bruno-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });

    expect(room.snapshotFor("bruno-id")).toEqual(before);
  });

  it("rejects a Reveal while no Votes have been cast and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.reveal("ana-id")).toEqual({ ok: false, reason: "no-votes" });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("locks every Vote: a Vote after the Reveal is rejected and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 8);
    room.reveal("ana-id");
    const before = room.snapshotFor("bruno-id");

    expect(room.vote("ana-id", 64)).toEqual({
      ok: false,
      reason: "round-revealed",
    });
    expect(room.vote("bruno-id", 2)).toEqual({
      ok: false,
      reason: "round-revealed",
    });

    expect(room.snapshotFor("bruno-id")).toEqual(before);
  });

  it("rejects a second Reveal of the same Round, leaving the Room unchanged and nobody notified", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);
    room.reveal("ana-id");
    const before = room.snapshotFor("ana-id");
    const onChange = vi.fn();
    room.subscribe(onChange);

    expect(room.reveal("ana-id")).toEqual({
      ok: false,
      reason: "already-revealed",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("a New Round", () => {
  it("after the Reveal, clears every Vote and the Reveal for everyone, and voting opens again", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 8);
    room.vote("bruno-id", 16);
    room.reveal("ana-id");

    expect(room.newRound("ana-id")).toEqual({ ok: true });

    for (const id of ["ana-id", "bruno-id"]) {
      const snapshot = room.snapshotFor(id);
      expect(snapshot.revealed).toBe(false);
      expect(snapshot.result).toBeNull();
      expect(snapshot.myVote).toBeNull();
      expect(snapshot.participants).toEqual([
        participant("ana-id", "Ana", { isFacilitator: true }),
        participant("bruno-id", "Bruno"),
      ]);
    }
    expect(room.vote("bruno-id", 4)).toEqual({ ok: true });
  });

  it("before the Reveal, discards the Votes so they are never shown", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 64);
    room.vote("bruno-id", 32);

    expect(room.newRound("ana-id")).toEqual({ ok: true });
    room.vote("ana-id", 2);
    room.reveal("ana-id");

    const brunoSees = room.snapshotFor("bruno-id");
    expect(brunoSees.participants.map((p) => [p.name, p.vote])).toEqual([
      ["Ana", 2],
      ["Bruno", null],
    ]);
    expect(brunoSees.result).toBe(2);
    expect(JSON.stringify(brunoSees)).not.toMatch(/\b(64|32)\b/);
  });

  it("rejects a New Round from anyone but the Facilitator and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("bruno-id", 8);
    const before = room.snapshotFor("bruno-id");

    expect(room.newRound("bruno-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });

    expect(room.snapshotFor("bruno-id")).toEqual(before);
  });
});
