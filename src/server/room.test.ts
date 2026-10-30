import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
    connected: true,
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

describe("Observers", () => {
  it("a Voter who switches to Observer is shown as one to everyone, and their Vote is discarded", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("bruno-id", 8);

    expect(room.becomeObserver("bruno-id")).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
      participant("bruno-id", "Bruno", { role: "observer" }),
    ]);
    expect(room.snapshotFor("bruno-id").myVote).toBeNull();
  });

  it("after the Reveal, switching to Observer leaves the revealed Votes and Result as they were", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 2);
    room.vote("bruno-id", 8);
    room.reveal("ana-id");

    expect(room.becomeObserver("bruno-id")).toEqual({ ok: true });

    const anaSees = room.snapshotFor("ana-id");
    expect(anaSees.participants.map((p) => [p.name, p.role, p.vote])).toEqual([
      ["Ana", "voter", 2],
      ["Bruno", "observer", 8],
    ]);
    expect(anaSees.result).toBe(5);
  });

  it("rejects a Vote from an Observer and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.becomeObserver("bruno-id");
    const before = room.snapshotFor("ana-id");

    expect(room.vote("bruno-id", 8)).toEqual({
      ok: false,
      reason: "observer-cannot-vote",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
    expect(room.snapshotFor("bruno-id").myVote).toBeNull();
  });

  it("an Observer who switches back to Voter can vote in the current Round", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.becomeObserver("bruno-id");

    expect(room.becomeVoter("bruno-id")).toEqual({ ok: true });
    expect(room.vote("bruno-id", 8)).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
      participant("bruno-id", "Bruno", { hasVoted: true }),
    ]);
  });

  it("the Facilitator keeps the role as an Observer, and can still Reveal and start a New Round", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.becomeObserver("ana-id");
    room.vote("bruno-id", 8);

    expect(room.snapshotFor("bruno-id").participants[0]).toEqual(
      participant("ana-id", "Ana", { role: "observer", isFacilitator: true }),
    );
    expect(room.reveal("ana-id")).toEqual({ ok: true });
    expect(room.newRound("ana-id")).toEqual({ ok: true });
  });

  it("rejects a role switch from someone who isn't in the Room and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.becomeObserver("stranger-id")).toEqual({
      ok: false,
      reason: "not-in-room",
    });
    expect(room.becomeVoter("stranger-id")).toEqual({
      ok: false,
      reason: "not-in-room",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("stays an Observer after rejoining with the same Participant ID (a page reload)", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.becomeObserver("bruno-id");

    expect(room.join("bruno-id", "Bruno")).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").participants[1]).toEqual(
      participant("bruno-id", "Bruno", { role: "observer" }),
    );
  });
});

describe("handing over the Facilitator role", () => {
  it("moves the role to another Participant, and everyone sees exactly one Facilitator", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");

    expect(room.handOver("ana-id", "bruno-id")).toEqual({ ok: true });

    for (const id of ["ana-id", "bruno-id", "carla-id"]) {
      expect(room.snapshotFor(id).participants).toEqual([
        participant("ana-id", "Ana"),
        participant("bruno-id", "Bruno", { isFacilitator: true }),
        participant("carla-id", "Carla"),
      ]);
    }
  });

  it("rejects a hand-over from anyone but the Facilitator and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    const before = room.snapshotFor("ana-id");

    expect(room.handOver("bruno-id", "bruno-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("rejects a hand-over to someone who isn't in the Room and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.handOver("ana-id", "stranger-id")).toEqual({
      ok: false,
      reason: "unknown-participant",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("can go to an Observer, who can then Reveal and start a New Round while the previous Facilitator can't", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.becomeObserver("bruno-id");
    room.vote("ana-id", 8);

    expect(room.handOver("ana-id", "bruno-id")).toEqual({ ok: true });

    expect(room.reveal("ana-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });
    expect(room.reveal("bruno-id")).toEqual({ ok: true });
    expect(room.newRound("ana-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });
    expect(room.newRound("bruno-id")).toEqual({ ok: true });
    expect(room.handOver("ana-id", "ana-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });
  });

  it("leaves the Round, its Votes and the Reveal as they were", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 4);
    room.vote("bruno-id", 8);
    room.reveal("ana-id");

    room.handOver("ana-id", "bruno-id");

    const anaSees = room.snapshotFor("ana-id");
    expect(anaSees.revealed).toBe(true);
    expect(anaSees.result).toBe(6);
    expect(anaSees.participants.map((p) => [p.name, p.vote])).toEqual([
      ["Ana", 4],
      ["Bruno", 8],
    ]);
  });

  it("rejects the Facilitator handing the role to themselves, leaving the Room unchanged and nobody notified", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    const before = room.snapshotFor("ana-id");
    const onChange = vi.fn();
    room.subscribe(onChange);

    expect(room.handOver("ana-id", "ana-id")).toEqual({
      ok: false,
      reason: "already-facilitator",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("disconnects and the grace period", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows a Participant whose connection drops as away, to everyone", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");

    expect(room.disconnect("bruno-id")).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
      participant("bruno-id", "Bruno", { connected: false }),
    ]);
  });

  it("removes them and discards their Vote when 30 seconds pass, telling everyone", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 2);
    room.vote("bruno-id", 8);
    room.disconnect("bruno-id");
    const onChange = vi.fn();
    room.subscribe(onChange);

    vi.advanceTimersByTime(29_999);
    expect(room.snapshotFor("ana-id").participants).toHaveLength(2);
    expect(onChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true, hasVoted: true }),
    ]);
    room.reveal("ana-id");
    expect(room.snapshotFor("ana-id").result).toBe(2);
  });

  it("restores a Participant exactly as before when they rejoin at 29 seconds, and keeps them after that", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.vote("bruno-id", 8);
    room.becomeObserver("carla-id");
    room.disconnect("bruno-id");
    room.disconnect("carla-id");

    vi.advanceTimersByTime(29_000);
    expect(room.join("bruno-id", "Bruno")).toEqual({ ok: true });
    expect(room.join("carla-id", "Carla")).toEqual({ ok: true });
    vi.advanceTimersByTime(60_000);

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
      participant("bruno-id", "Bruno", { hasVoted: true }),
      participant("carla-id", "Carla", { role: "observer" }),
    ]);
    expect(room.snapshotFor("bruno-id").myVote).toBe(8);
  });

  it("keeps an away Participant's name reserved: nobody else can take it, but they can rejoin with it", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.disconnect("bruno-id");
    vi.advanceTimersByTime(10_000);

    expect(room.join("impostor-id", "bruno")).toEqual({
      ok: false,
      reason: "name-taken",
    });
    expect(room.join("bruno-id", "Bruno")).toEqual({ ok: true });
  });

  it("keeps the Facilitator's role through a brief disconnect", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.disconnect("ana-id");
    vi.advanceTimersByTime(29_000);

    room.join("ana-id", "Ana");

    expect(room.snapshotFor("bruno-id").participants[0]).toEqual(
      participant("ana-id", "Ana", { isFacilitator: true }),
    );
  });

  it("keeps a Participant connected while any of their connections (say, a second tab) is still open", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("bruno-id", "Bruno");

    room.disconnect("bruno-id");
    vi.advanceTimersByTime(60_000);

    expect(room.snapshotFor("ana-id").participants[1]).toEqual(
      participant("bruno-id", "Bruno"),
    );

    room.disconnect("bruno-id");
    expect(room.snapshotFor("ana-id").participants[1]).toEqual(
      participant("bruno-id", "Bruno", { connected: false }),
    );
  });

  it("rejects a disconnect for someone who isn't in the Room and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.disconnect("stranger-id")).toEqual({
      ok: false,
      reason: "not-in-room",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });

  it("leaves no Facilitator when the Facilitator's grace period expires, even if they come back later", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.disconnect("ana-id");
    vi.advanceTimersByTime(30_000);

    expect(room.snapshotFor("bruno-id").participants).toEqual([
      participant("bruno-id", "Bruno"),
    ]);

    room.join("ana-id", "Ana");
    expect(
      room.snapshotFor("bruno-id").participants.some((p) => p.isFacilitator),
    ).toBe(false);
  });
});

describe("recovering from a lost Facilitator", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("discards the current Round and leaves no Facilitator when the Facilitator's grace period expires", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.vote("ana-id", 4);
    room.vote("bruno-id", 8);
    room.reveal("ana-id");
    room.disconnect("ana-id");

    vi.advanceTimersByTime(30_000);

    for (const id of ["bruno-id", "carla-id"]) {
      const snapshot = room.snapshotFor(id);
      expect(snapshot.hasFacilitator).toBe(false);
      expect(snapshot.revealed).toBe(false);
      expect(snapshot.result).toBeNull();
      expect(snapshot.myVote).toBeNull();
      expect(snapshot.participants).toEqual([
        participant("bruno-id", "Bruno"),
        participant("carla-id", "Carla"),
      ]);
    }
  });

  it("lets anyone claim the role while there's no Facilitator", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.disconnect("ana-id");
    vi.advanceTimersByTime(30_000);

    expect(room.claimFacilitator("carla-id")).toEqual({ ok: true });

    const brunoSees = room.snapshotFor("bruno-id");
    expect(brunoSees.hasFacilitator).toBe(true);
    expect(brunoSees.participants).toEqual([
      participant("bruno-id", "Bruno"),
      participant("carla-id", "Carla", { isFacilitator: true }),
    ]);
  });

  it("first claim wins: two claims in a row leave exactly one Facilitator, and the Room unchanged by the second", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.disconnect("ana-id");
    vi.advanceTimersByTime(30_000);

    expect(room.claimFacilitator("bruno-id")).toEqual({ ok: true });
    const afterFirstClaim = room.snapshotFor("carla-id");
    expect(room.claimFacilitator("carla-id")).toEqual({
      ok: false,
      reason: "facilitator-exists",
    });

    expect(room.snapshotFor("carla-id")).toEqual(afterFirstClaim);
    expect(afterFirstClaim.participants.filter((p) => p.isFacilitator)).toEqual(
      [participant("bruno-id", "Bruno", { isFacilitator: true })],
    );
  });

  it("rejects a claim while the Facilitator is present and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    const before = room.snapshotFor("bruno-id");

    expect(room.claimFacilitator("bruno-id")).toEqual({
      ok: false,
      reason: "facilitator-exists",
    });

    expect(room.snapshotFor("bruno-id")).toEqual(before);
  });

  it("rejects a claim from someone who isn't in the Room and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.disconnect("ana-id");
    vi.advanceTimersByTime(30_000);
    const before = room.snapshotFor("bruno-id");

    expect(room.claimFacilitator("stranger-id")).toEqual({
      ok: false,
      reason: "not-in-room",
    });

    expect(room.snapshotFor("bruno-id")).toEqual(before);
  });

  it("keeps the role and the whole Round when the Facilitator reconnects at 29 seconds", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 4);
    room.vote("bruno-id", 8);
    room.reveal("ana-id");
    room.disconnect("ana-id");

    vi.advanceTimersByTime(29_000);
    room.join("ana-id", "Ana");
    vi.advanceTimersByTime(60_000);

    const brunoSees = room.snapshotFor("bruno-id");
    expect(brunoSees.hasFacilitator).toBe(true);
    expect(brunoSees.revealed).toBe(true);
    expect(brunoSees.result).toBe(6);
    expect(
      brunoSees.participants.map((p) => [p.name, p.isFacilitator, p.vote]),
    ).toEqual([
      ["Ana", true, 4],
      ["Bruno", false, 8],
    ]);
  });

  it("lets nobody Reveal or start a New Round while there's no Facilitator", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.disconnect("ana-id");
    vi.advanceTimersByTime(30_000);
    room.vote("bruno-id", 8);
    const before = room.snapshotFor("bruno-id");

    expect(room.reveal("bruno-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });
    expect(room.newRound("bruno-id")).toEqual({
      ok: false,
      reason: "not-facilitator",
    });
    expect(room.snapshotFor("bruno-id")).toEqual(before);
  });

  it("makes the first Participant back into an empty Room its Facilitator, as after a server restart", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.disconnect("ana-id");
    room.disconnect("bruno-id");
    vi.advanceTimersByTime(30_000);

    room.join("bruno-id", "Bruno");
    room.join("ana-id", "Ana");

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("bruno-id", "Bruno", { isFacilitator: true }),
      participant("ana-id", "Ana"),
    ]);
  });
});

describe("leaving the Room", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("removes the Participant and their Vote at once, telling everyone, and frees their name", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("bruno-id", 8);
    const onChange = vi.fn();
    room.subscribe(onChange);

    expect(room.leave("bruno-id")).toEqual({ ok: true });

    expect(onChange).toHaveBeenCalled();
    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
    ]);
    expect(room.join("carla-id", "Bruno")).toEqual({ ok: true });
  });

  it("removes them even while another of their connections is still open", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("bruno-id", "Bruno");

    room.leave("bruno-id");

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
    ]);
  });

  it("cancels the grace period of an away Participant who leaves", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.disconnect("bruno-id");
    room.leave("bruno-id");
    room.join("bruno-id", "Bruno");

    vi.advanceTimersByTime(30_000);

    expect(room.snapshotFor("ana-id").participants).toEqual([
      participant("ana-id", "Ana", { isFacilitator: true }),
      participant("bruno-id", "Bruno"),
    ]);
  });

  it("hands the Facilitator role on, keeping the Round, its Votes and the Reveal", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 8);
    room.vote("bruno-id", 16);
    room.reveal("ana-id");
    const { round } = room.snapshotFor("bruno-id");

    room.leave("ana-id");

    const snapshot = room.snapshotFor("bruno-id");
    expect(snapshot.participants).toEqual([
      participant("bruno-id", "Bruno", {
        isFacilitator: true,
        hasVoted: true,
        vote: 16,
      }),
    ]);
    expect(snapshot).toMatchObject({ round, revealed: true, result: 16 });
  });

  it("hands the Facilitator role to someone present rather than someone away", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.disconnect("bruno-id");

    room.leave("ana-id");

    expect(room.snapshotFor("carla-id").participants).toEqual([
      participant("bruno-id", "Bruno", { connected: false }),
      participant("carla-id", "Carla", { isFacilitator: true }),
    ]);
  });

  it("leaves an empty Room when the last Participant leaves, so the next one in is its Facilitator", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);

    room.leave("ana-id");
    room.join("bruno-id", "Bruno");

    expect(room.snapshotFor("bruno-id")).toMatchObject({
      participants: [participant("bruno-id", "Bruno", { isFacilitator: true })],
      myVote: null,
      revealed: false,
    });
  });

  it("rejects a leave from someone who isn't in the Room and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const before = room.snapshotFor("ana-id");

    expect(room.leave("ghost-id")).toEqual({
      ok: false,
      reason: "not-in-room",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
  });
});

describe("Reactions and Throws", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** Ana and Bruno are Voters; Carla is an Observer. Everyone's snapshots so far, to compare. */
  function tableOfThree() {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.becomeObserver("carla-id");
    room.vote("ana-id", 8);
    const fun = vi.fn();
    room.subscribeToFun(fun);
    const onChange = vi.fn();
    room.subscribe(onChange);
    const before = () =>
      ["ana-id", "bruno-id", "carla-id"].map((id) => room.snapshotFor(id));
    return { room, fun, onChange, snapshots: before(), before };
  }

  it("sends a Voter's Reaction to everyone once, changing nothing in the Room", () => {
    const { room, fun, onChange, snapshots, before } = tableOfThree();

    expect(room.react("ana-id", "🎉")).toEqual({ ok: true });

    expect(fun).toHaveBeenCalledExactlyOnceWith({
      kind: "reaction",
      from: "ana-id",
      reaction: "🎉",
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(before()).toEqual(snapshots);
  });

  it("sends a Throw at another Voter to everyone once, from Voters and Observers alike", () => {
    const { room, fun, onChange, snapshots, before } = tableOfThree();

    expect(room.throwAt("bruno-id", "ana-id", "tomato")).toEqual({ ok: true });
    expect(room.throwAt("carla-id", "ana-id", "flowers")).toEqual({
      ok: true,
    });

    expect(fun.mock.calls).toEqual([
      [{ kind: "throw", from: "bruno-id", to: "ana-id", item: "tomato" }],
      [{ kind: "throw", from: "carla-id", to: "ana-id", item: "flowers" }],
    ]);
    expect(onChange).not.toHaveBeenCalled();
    expect(before()).toEqual(snapshots);
  });

  it("works after the Reveal too", () => {
    const { room, fun } = tableOfThree();
    room.reveal("ana-id");

    expect(room.react("bruno-id", "😱")).toEqual({ ok: true });
    expect(room.throwAt("bruno-id", "ana-id", "egg")).toEqual({ ok: true });
    expect(fun).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["an Observer", "carla-id", "🎉", "observer-cannot-react"],
    ["someone who isn't in the Room", "ghost-id", "🎉", "not-in-room"],
    ["something that isn't a Reaction", "ana-id", "💩", "not-a-reaction"],
  ] as const)(
    "rejects a Reaction from %s, sending nothing and leaving the Room unchanged",
    (_, from, reaction, reason) => {
      const { room, fun, onChange, snapshots, before } = tableOfThree();

      expect(room.react(from, reaction)).toEqual({ ok: false, reason });

      expect(fun).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(before()).toEqual(snapshots);
    },
  );

  it.each([
    [
      "from someone who isn't in the Room",
      "ghost-id",
      "ana-id",
      "rock",
      "not-in-room",
    ],
    [
      "at someone who isn't in the Room",
      "ana-id",
      "ghost-id",
      "rock",
      "unknown-participant",
    ],
    ["at yourself", "ana-id", "ana-id", "rock", "cannot-throw-at-yourself"],
    [
      "at an Observer",
      "ana-id",
      "carla-id",
      "rock",
      "cannot-throw-at-observer",
    ],
    [
      "of something that isn't throwable",
      "ana-id",
      "bruno-id",
      "piano",
      "not-throwable",
    ],
  ] as const)(
    "rejects a Throw %s, sending nothing and leaving the Room unchanged",
    (_, by, to, item, reason) => {
      const { room, fun, onChange, snapshots, before } = tableOfThree();

      expect(room.throwAt(by, to, item)).toEqual({ ok: false, reason });

      expect(fun).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
      expect(before()).toEqual(snapshots);
    },
  );

  it("allows a burst of 3, then one more every 300 ms, shared between Reactions and Throws", () => {
    const { room, fun } = tableOfThree();

    expect(room.react("ana-id", "🔥")).toEqual({ ok: true });
    expect(room.throwAt("ana-id", "bruno-id", "rock")).toEqual({ ok: true });
    expect(room.react("ana-id", "🔥")).toEqual({ ok: true });
    expect(room.throwAt("ana-id", "bruno-id", "rock")).toEqual({
      ok: false,
      reason: "burst-used-up",
    });

    vi.advanceTimersByTime(299);
    expect(room.react("ana-id", "🔥")).toEqual({
      ok: false,
      reason: "burst-used-up",
    });
    vi.advanceTimersByTime(1);
    expect(room.react("ana-id", "🔥")).toEqual({ ok: true });

    expect(fun).toHaveBeenCalledTimes(4);
  });

  it("saves up no more than 3, however long the pause", () => {
    const { room } = tableOfThree();
    for (let i = 0; i < 3; i++) room.react("ana-id", "👍");

    vi.advanceTimersByTime(60_000);

    for (let i = 0; i < 3; i++)
      expect(room.react("ana-id", "👍")).toEqual({ ok: true });
    expect(room.react("ana-id", "👍")).toEqual({
      ok: false,
      reason: "burst-used-up",
    });
  });

  it("counts each Participant's burst separately, and a rejected one doesn't use it up", () => {
    const { room } = tableOfThree();
    for (let i = 0; i < 3; i++) room.react("ana-id", "🤔");
    room.throwAt("bruno-id", "carla-id", "fish");

    for (let i = 0; i < 3; i++)
      expect(room.throwAt("bruno-id", "ana-id", "fish")).toEqual({ ok: true });
  });

  it("stops sending to a subscriber once they unsubscribe", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const fun = vi.fn();
    const unsubscribe = room.subscribeToFun(fun);

    unsubscribe();
    room.react("ana-id", "🎉");

    expect(fun).not.toHaveBeenCalled();
  });
});
