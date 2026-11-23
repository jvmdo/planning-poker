import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DECK } from "../shared/deck.js";
import type { ParticipantView, RoomSnapshot } from "../shared/protocol.js";
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
    ghost: null,
    ...overrides,
  };
}

/**
 * A snapshot as text to search for Votes. The Deck lists every Card for everyone, so it's left out
 * of the text and checked instead: it must be exactly the Room's Deck, here the default.
 */
function serializedVotes(snapshot: RoomSnapshot): string {
  expect(snapshot.deck).toEqual(DEFAULT_DECK);
  return JSON.stringify({ ...snapshot, deck: undefined });
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

describe("a full Room", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A Room holding 30 Participants, the most it takes. */
  function fullRoom() {
    const room = createRoom();
    for (let n = 1; n <= 30; n++) room.join(`p${n}-id`, `P${n}`);
    return room;
  }

  it("refuses a 31st Participant and leaves the Room unchanged", () => {
    const room = fullRoom();
    const before = room.snapshotFor("p1-id");

    expect(room.join("ana-id", "Ana")).toEqual({
      ok: false,
      reason: "room-full",
    });

    expect(room.snapshotFor("p1-id")).toEqual(before);
    expect(before.participants).toHaveLength(30);
  });

  it("lets a Participant already in a full Room rejoin, even from their grace period", () => {
    const room = fullRoom();
    room.disconnect("p30-id");

    expect(room.join("p30-id", "P30")).toEqual({ ok: true });

    const participants = room.snapshotFor("p1-id").participants;
    expect(participants).toHaveLength(30);
    expect(participants.at(-1)).toEqual(participant("p30-id", "P30"));
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

    const anaSees = serializedVotes(room.snapshotFor("ana-id"));
    const brunoSees = serializedVotes(room.snapshotFor("bruno-id"));
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
    expect(serializedVotes(brunoSees)).not.toMatch(/\b(64|32)\b/);
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

  it("removes them and leaves their Vote out when 30 seconds pass, telling everyone", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.setAutoReveal("ana-id", false);
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

  describe("a Voter who comes back after their grace period ran out", () => {
    function awayTooLong() {
      const room = createRoom();
      room.join("ana-id", "Ana");
      room.join("bruno-id", "Bruno");
      room.setAutoReveal("ana-id", false);
      room.vote("ana-id", 2);
      room.vote("bruno-id", 8);
      room.disconnect("bruno-id");
      vi.advanceTimersByTime(30_000);
      return room;
    }

    it("gets their Vote back before the Reveal", () => {
      const room = awayTooLong();

      room.join("bruno-id", "Bruno");

      expect(room.snapshotFor("ana-id").participants[1]).toEqual(
        participant("bruno-id", "Bruno", { hasVoted: true }),
      );
      expect(room.snapshotFor("bruno-id").myVote).toBe(8);
      room.reveal("ana-id");
      expect(room.snapshotFor("ana-id").result).toBe(5);
    });

    it("gets their Vote back after the Reveal, face-up and in the Result", () => {
      const room = awayTooLong();
      room.reveal("ana-id");
      expect(room.snapshotFor("ana-id").result).toBe(2);

      room.join("bruno-id", "Bruno");

      expect(room.snapshotFor("ana-id").participants[1]).toEqual(
        participant("bruno-id", "Bruno", { hasVoted: true, vote: 8 }),
      );
      expect(room.snapshotFor("ana-id").result).toBe(5);
    });

    it("doesn't get it back once the next Round has started", () => {
      const room = awayTooLong();
      room.newRound("ana-id");

      room.join("bruno-id", "Bruno");

      expect(room.snapshotFor("bruno-id").myVote).toBeNull();
    });

    it("doesn't get it back after the Deck changed", () => {
      const room = awayTooLong();
      room.setDeck("ana-id", [1, 2, 3, 5, 8]);

      room.join("bruno-id", "Bruno");

      expect(room.snapshotFor("bruno-id").myVote).toBeNull();
    });

    it("doesn't get it back when the Facilitator was lost meanwhile", () => {
      const room = createRoom();
      room.join("ana-id", "Ana");
      room.join("bruno-id", "Bruno");
      room.vote("bruno-id", 8);
      room.disconnect("bruno-id");
      room.disconnect("ana-id");
      vi.advanceTimersByTime(30_000);

      room.join("bruno-id", "Bruno");

      expect(room.snapshotFor("bruno-id").myVote).toBeNull();
    });

    it("doesn't get it back after choosing to Leave", () => {
      const room = createRoom();
      room.join("ana-id", "Ana");
      room.join("bruno-id", "Bruno");
      room.vote("bruno-id", 8);
      room.leave("bruno-id");

      room.join("bruno-id", "Bruno");

      expect(room.snapshotFor("bruno-id").myVote).toBeNull();
    });

    it("leaves nothing for anyone else who joins", () => {
      const room = awayTooLong();

      room.join("carla-id", "Carla");

      expect(room.snapshotFor("carla-id").myVote).toBeNull();
      expect(room.snapshotFor("ana-id").participants[1]).toEqual(
        participant("carla-id", "Carla"),
      );
    });
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

    expect(room.leave("stranger-id")).toEqual({
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
    ["someone who isn't in the Room", "stranger-id", "🎉", "not-in-room"],
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
      "stranger-id",
      "ana-id",
      "rock",
      "not-in-room",
    ],
    [
      "at someone who isn't in the Room",
      "ana-id",
      "stranger-id",
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

  describe("with Ghosts", () => {
    /** Carla's Ghost is out; Davi is an Observer without one. */
    function withGhost() {
      const table = tableOfThree();
      const { room } = table;
      room.summonGhost("carla-id", {
        fabric: "coral-stripes",
        disguise: "none",
      });
      room.join("davi-id", "Davi");
      room.becomeObserver("davi-id");
      table.onChange.mockClear();
      return { ...table, snapshots: table.before() };
    }

    it("sends a Reaction from an Observer whose Ghost is out, changing nothing in the Room", () => {
      const { room, fun, onChange, snapshots, before } = withGhost();

      expect(room.react("carla-id", "🎉")).toEqual({ ok: true });

      expect(fun).toHaveBeenCalledExactlyOnceWith({
        kind: "reaction",
        from: "carla-id",
        reaction: "🎉",
      });
      expect(onChange).not.toHaveBeenCalled();
      expect(before()).toEqual(snapshots);
    });

    it("still rejects a Reaction from an Observer without a Ghost, or whose Ghost was put away", () => {
      const { room, fun } = withGhost();

      expect(room.react("davi-id", "🎉")).toEqual({
        ok: false,
        reason: "observer-cannot-react",
      });
      room.dismissGhost("carla-id");
      expect(room.react("carla-id", "🎉")).toEqual({
        ok: false,
        reason: "observer-cannot-react",
      });
      expect(fun).not.toHaveBeenCalled();
    });

    it("sends a Throw at a Ghost to everyone once, from Voters, other Ghosts and Observers without one, changing nothing", () => {
      const { room, fun, onChange, snapshots, before } = withGhost();
      room.join("eva-id", "Eva");
      room.becomeObserver("eva-id");
      room.summonGhost("eva-id", { fabric: "coral-stripes", disguise: "none" });
      onChange.mockClear();
      const withEva = before();

      expect(room.throwAt("ana-id", "carla-id", "tomato")).toEqual({
        ok: true,
      });
      expect(room.throwAt("eva-id", "carla-id", "egg")).toEqual({ ok: true });
      expect(room.throwAt("davi-id", "carla-id", "flowers")).toEqual({
        ok: true,
      });

      expect(fun.mock.calls).toEqual([
        [{ kind: "throw", from: "ana-id", to: "carla-id", item: "tomato" }],
        [{ kind: "throw", from: "eva-id", to: "carla-id", item: "egg" }],
        [{ kind: "throw", from: "davi-id", to: "carla-id", item: "flowers" }],
      ]);
      expect(onChange).not.toHaveBeenCalled();
      expect(before()).toEqual(withEva);
      expect(withEva).not.toEqual(snapshots);
    });

    it("sends a Throw at a Ghost whose owner is away", () => {
      const { room, fun } = withGhost();
      room.disconnect("carla-id");

      expect(room.throwAt("ana-id", "carla-id", "rock")).toEqual({ ok: true });
      expect(fun).toHaveBeenCalledOnce();
    });

    it("sends a Throw from a Ghost at a Voter", () => {
      const { room, fun } = withGhost();

      expect(room.throwAt("carla-id", "bruno-id", "fish")).toEqual({
        ok: true,
      });
      expect(fun).toHaveBeenCalledExactlyOnceWith({
        kind: "throw",
        from: "carla-id",
        to: "bruno-id",
        item: "fish",
      });
    });

    it.each([
      [
        "at an Observer without a Ghost",
        "ana-id",
        "davi-id",
        "cannot-throw-at-observer",
      ],
      [
        "from a Ghost at itself",
        "carla-id",
        "carla-id",
        "cannot-throw-at-yourself",
      ],
    ] as const)(
      "still rejects a Throw %s, sending nothing",
      (_, by, to, reason) => {
        const { room, fun, onChange, snapshots, before } = withGhost();

        expect(room.throwAt(by, to, "rock")).toEqual({ ok: false, reason });

        expect(fun).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(before()).toEqual(snapshots);
      },
    );

    it("spends a Ghost's Reactions and Throws from the same burst as everyone's", () => {
      const { room } = withGhost();

      expect(room.react("carla-id", "🔥")).toEqual({ ok: true });
      expect(room.throwAt("carla-id", "ana-id", "rock")).toEqual({ ok: true });
      expect(room.react("carla-id", "🔥")).toEqual({ ok: true });
      expect(room.throwAt("carla-id", "ana-id", "rock")).toEqual({
        ok: false,
        reason: "burst-used-up",
      });
      vi.advanceTimersByTime(300);
      expect(room.react("carla-id", "🔥")).toEqual({ ok: true });

      for (let i = 0; i < 3; i++) room.throwAt("ana-id", "carla-id", "egg");
      expect(room.throwAt("ana-id", "carla-id", "egg")).toEqual({
        ok: false,
        reason: "burst-used-up",
      });
    });

    it("rejects a Throw at a Ghost once it's put away", () => {
      const { room, fun } = withGhost();
      room.dismissGhost("carla-id");

      expect(room.throwAt("ana-id", "carla-id", "rock")).toEqual({
        ok: false,
        reason: "cannot-throw-at-observer",
      });
      expect(fun).not.toHaveBeenCalled();
    });
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

describe("the Deck", () => {
  it("starts as the default hours Deck, the same for everyone", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");

    const deck = [1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64];
    expect(room.snapshotFor("ana-id").deck).toEqual(deck);
    expect(room.snapshotFor("bruno-id").deck).toEqual(deck);
  });

  it("is changed by the Facilitator for everyone, sorted and without duplicates", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");

    expect(room.setDeck("ana-id", [8, 3, 1, 5, 3, 2])).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").deck).toEqual([1, 2, 3, 5, 8]);
    expect(room.snapshotFor("bruno-id").deck).toEqual([1, 2, 3, 5, 8]);
  });

  it("accepts Votes only for Cards in the Room's Deck", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.setDeck("ana-id", [1, 3, 5, 99]);

    expect(room.vote("ana-id", 4)).toEqual({
      ok: false,
      reason: "card-not-in-deck",
    });
    expect(room.vote("ana-id", 99)).toEqual({ ok: true });
    expect(room.vote("ana-id", 1)).toEqual({ ok: true });
    expect(room.snapshotFor("ana-id").myVote).toBe(1);
  });

  it("before the Reveal, a changed Deck discards the Votes unseen and starts a new Round", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 8);
    room.vote("bruno-id", 64);
    const { round } = room.snapshotFor("ana-id");

    room.setDeck("ana-id", [1, 2, 3, 5, 8]);

    for (const id of ["ana-id", "bruno-id"]) {
      expect(room.snapshotFor(id)).toMatchObject({
        participants: [
          participant("ana-id", "Ana", { isFacilitator: true }),
          participant("bruno-id", "Bruno"),
        ],
        myVote: null,
        round: round + 1,
        revealed: false,
        result: null,
      });
    }
  });

  it("after the Reveal, a changed Deck clears the Votes and the Reveal, and starts a new Round", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);
    room.reveal("ana-id");
    const { round } = room.snapshotFor("ana-id");

    room.setDeck("ana-id", [1, 2, 3]);

    expect(room.snapshotFor("ana-id")).toMatchObject({
      myVote: null,
      round: round + 1,
      revealed: false,
      result: null,
    });
  });

  it("tells Deck change subscribers once, with who changed it", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    const listener = vi.fn();
    room.subscribeToDeckChanges(listener);

    room.setDeck("bruno-id", [1, 2, 3]);
    room.setDeck("ana-id", [1, 2, 3]);
    room.setDeck("ana-id", [3, 2, 1]);
    room.setDeck("ana-id", [1, 200]);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("ana-id");
  });

  it("rejects the Deck the Room already has, even typed in another order, and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.setDeck("ana-id", [1, 2, 3]);
    room.vote("ana-id", 2);
    const before = room.snapshotFor("ana-id");
    const listener = vi.fn();
    room.subscribe(listener);

    expect(room.setDeck("ana-id", [3, 2, 1, 1])).toEqual({
      ok: false,
      reason: "deck-unchanged",
    });

    expect(room.snapshotFor("ana-id")).toEqual(before);
    expect(listener).not.toHaveBeenCalled();
  });

  it("can be set by an Observer who is the Facilitator", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.becomeObserver("ana-id");

    expect(room.setDeck("ana-id", [1, 2])).toEqual({ ok: true });
    expect(room.snapshotFor("ana-id").deck).toEqual([1, 2]);
  });

  it("rejects a Deck from anyone but the Facilitator and leaves the Room unchanged", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("bruno-id", 8);
    const before = room.snapshotFor("bruno-id");

    expect(room.setDeck("bruno-id", [1, 2, 3])).toEqual({
      ok: false,
      reason: "not-facilitator",
    });

    expect(room.snapshotFor("bruno-id")).toEqual(before);
  });

  it.each([
    { cards: [1], reason: "too-few-cards" },
    { cards: [5, 5], reason: "too-few-cards" },
    { cards: [], reason: "too-few-cards" },
    {
      cards: Array.from({ length: 16 }, (_, i) => i + 1),
      reason: "too-many-cards",
    },
    { cards: [1, 2.5], reason: "not-a-card" },
    { cards: [-1, 2], reason: "not-a-card" },
    { cards: [0, 2], reason: "not-a-card" },
    { cards: [1, 100], reason: "not-a-card" },
    { cards: [1, "2"], reason: "not-a-card" },
    { cards: [1, null], reason: "not-a-card" },
    { cards: [1, Number.NaN], reason: "not-a-card" },
  ])(
    "rejects $cards as $reason and leaves the Room unchanged",
    ({ cards, reason }) => {
      const room = createRoom();
      room.join("ana-id", "Ana");
      room.vote("ana-id", 8);
      const before = room.snapshotFor("ana-id");

      expect(room.setDeck("ana-id", cards)).toEqual({ ok: false, reason });

      expect(room.snapshotFor("ana-id")).toEqual(before);
    },
  );

  it("accepts 15 Cards from 1 to 99", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    const cards = [1, 2, 3, 5, 8, 13, 21, 34, 40, 55, 60, 70, 80, 89, 99];

    expect(room.setDeck("ana-id", cards)).toEqual({ ok: true });
    expect(room.snapshotFor("ana-id").deck).toEqual(cards);
  });

  it("stays as the Facilitator set it after the last Participant leaves, for the next one in", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.setDeck("ana-id", [1, 2, 3, 5, 8]);

    room.leave("ana-id");
    room.join("bruno-id", "Bruno");

    expect(room.snapshotFor("bruno-id").deck).toEqual([1, 2, 3, 5, 8]);
  });
});

describe("an empty Room", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is empty before anyone joins and after the last Participant leaves", () => {
    const room = createRoom();
    expect(room.isEmpty()).toBe(true);

    room.join("ana-id", "Ana");
    expect(room.isEmpty()).toBe(false);

    room.leave("ana-id");
    expect(room.isEmpty()).toBe(true);
  });

  it("isn't empty while its last Participant is in their grace period", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");

    room.disconnect("ana-id");
    vi.advanceTimersByTime(29_999);
    expect(room.isEmpty()).toBe(false);

    vi.advanceTimersByTime(1);
    expect(room.isEmpty()).toBe(true);
  });
});

describe("Auto Reveal", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is on in a new Room, and Reveals the Round 3 seconds after every Voter has voted", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    expect(room.snapshotFor("bruno-id").autoReveal).toBe(true);

    room.vote("ana-id", 8);
    room.vote("bruno-id", 16);
    vi.advanceTimersByTime(2_999);
    expect(room.snapshotFor("bruno-id").revealed).toBe(false);

    vi.advanceTimersByTime(1);
    expect(room.snapshotFor("bruno-id")).toMatchObject({
      revealed: true,
      result: 12,
    });
  });

  it("is turned off and on by the Facilitator alone, for everyone, telling everyone who did it", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    const onAutoReveal = vi.fn();
    room.subscribeToAutoRevealChanges(onAutoReveal);

    expect(room.setAutoReveal("bruno-id", false)).toEqual({
      ok: false,
      reason: "not-facilitator",
    });
    expect(room.setAutoReveal("ana-id", false)).toEqual({ ok: true });
    expect(room.snapshotFor("bruno-id").autoReveal).toBe(false);
    expect(room.setAutoReveal("ana-id", false)).toEqual({
      ok: false,
      reason: "auto-reveal-unchanged",
    });
    expect(room.setAutoReveal("ana-id", true)).toEqual({ ok: true });
    expect(room.snapshotFor("bruno-id").autoReveal).toBe(true);

    expect(onAutoReveal.mock.calls).toEqual([
      ["ana-id", false],
      ["ana-id", true],
    ]);
  });

  it("while off, leaves the Round unrevealed after every Voter has voted", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.setAutoReveal("ana-id", false);

    room.vote("ana-id", 8);
    vi.advanceTimersByTime(60_000);

    expect(room.snapshotFor("ana-id").revealed).toBe(false);
  });

  it("shows everyone the countdown, which a Voter joining stops", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.vote("ana-id", 8);
    expect(room.snapshotFor("bruno-id").countingDown).toBe(false);

    room.vote("bruno-id", 16);
    expect(room.snapshotFor("bruno-id").countingDown).toBe(true);
    vi.advanceTimersByTime(2_000);
    room.join("carla-id", "Carla");
    expect(room.snapshotFor("bruno-id").countingDown).toBe(false);
    vi.advanceTimersByTime(60_000);
    expect(room.snapshotFor("bruno-id").revealed).toBe(false);

    room.vote("carla-id", 4);
    vi.advanceTimersByTime(3_000);
    expect(room.snapshotFor("bruno-id")).toMatchObject({
      revealed: true,
      countingDown: false,
    });
  });

  it("waits while the Room has no Facilitator, and counts down once someone takes the role", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.disconnect("ana-id");
    vi.advanceTimersByTime(30_000);

    room.vote("bruno-id", 8);
    room.vote("carla-id", 16);
    vi.advanceTimersByTime(60_000);
    expect(room.snapshotFor("bruno-id")).toMatchObject({
      revealed: false,
      countingDown: false,
    });

    room.claimFacilitator("carla-id");
    expect(room.snapshotFor("bruno-id").countingDown).toBe(true);
    vi.advanceTimersByTime(3_000);
    expect(room.snapshotFor("bruno-id").revealed).toBe(true);
  });

  it("waits for a Voter who is away until their grace period runs out", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("carla-id", "Carla");
    room.disconnect("carla-id");
    room.vote("ana-id", 8);
    room.vote("bruno-id", 16);

    vi.advanceTimersByTime(29_999);
    expect(room.snapshotFor("bruno-id").countingDown).toBe(false);

    vi.advanceTimersByTime(1);
    expect(room.snapshotFor("bruno-id").countingDown).toBe(true);
    vi.advanceTimersByTime(3_000);
    expect(room.snapshotFor("bruno-id")).toMatchObject({
      revealed: true,
      result: 12,
    });
  });

  it("starts counting down when turned on after every Voter has voted, and stops when turned off", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.setAutoReveal("ana-id", false);
    room.vote("ana-id", 8);

    room.setAutoReveal("ana-id", true);
    expect(room.snapshotFor("ana-id").countingDown).toBe(true);
    vi.advanceTimersByTime(2_000);
    room.setAutoReveal("ana-id", false);
    expect(room.snapshotFor("ana-id").countingDown).toBe(false);

    vi.advanceTimersByTime(60_000);
    expect(room.snapshotFor("ana-id").revealed).toBe(false);
  });

  it("keeps counting down when a Voter changes their Vote, and Reveals the new one", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);

    vi.advanceTimersByTime(2_000);
    room.vote("ana-id", 16);
    vi.advanceTimersByTime(1_000);

    expect(room.snapshotFor("ana-id")).toMatchObject({
      revealed: true,
      result: 16,
    });
  });

  it("is cut short by the Facilitator's Reveal, which happens once", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);
    const onChange = vi.fn();
    room.subscribe(onChange);

    expect(room.reveal("ana-id")).toEqual({ ok: true });
    expect(room.snapshotFor("ana-id")).toMatchObject({
      revealed: true,
      countingDown: false,
    });
    vi.advanceTimersByTime(60_000);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("is stopped by a New Round, which then waits for the new Votes", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.vote("ana-id", 8);

    room.newRound("ana-id");
    vi.advanceTimersByTime(60_000);

    expect(room.snapshotFor("ana-id")).toMatchObject({
      revealed: false,
      countingDown: false,
    });
  });

  it("stays as the Facilitator set it when everyone leaves", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.setAutoReveal("ana-id", false);
    room.leave("ana-id");

    room.join("bruno-id", "Bruno");

    expect(room.snapshotFor("bruno-id").autoReveal).toBe(false);
  });
});

describe("Ghosts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const coral = { fabric: "coral-stripes", disguise: "none" } as const;
  const middle = { x: 0.5, y: 0.5 };

  /** Ana and Bruno are Voters; Davi and Eva are Observers. */
  function meeting() {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");
    room.join("davi-id", "Davi");
    room.becomeObserver("davi-id");
    room.join("eva-id", "Eva");
    room.becomeObserver("eva-id");
    const onChange = vi.fn();
    room.subscribe(onChange);
    const everyone = ["ana-id", "bruno-id", "davi-id", "eva-id"];
    const snapshots = () => everyone.map((id) => room.snapshotFor(id));
    /** Someone's Ghost, as each Participant's snapshot shows it. */
    const ghostOf = (id: string) =>
      everyone.map(
        (viewer) =>
          room.snapshotFor(viewer).participants.find((p) => p.id === id)?.ghost,
      );
    return { room, onChange, snapshots, ghostOf };
  }

  it("appears in the middle of the Table when an Observer summons one, for everyone", () => {
    const { room, onChange, ghostOf } = meeting();

    expect(room.summonGhost("davi-id", coral)).toEqual({ ok: true });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ghostOf("davi-id")).toEqual(
      Array(4).fill({ skin: coral, to: middle }),
    );
    expect(ghostOf("eva-id")).toEqual(Array(4).fill(null));
  });

  it("nudges each new Ghost a little sideways from the ones already out, so they don't stack", () => {
    const { room, ghostOf } = meeting();
    room.join("fabio-id", "Fábio");
    room.becomeObserver("fabio-id");

    room.summonGhost("davi-id", coral);
    room.summonGhost("eva-id", coral);
    room.summonGhost("fabio-id", coral);

    const points = ["davi-id", "eva-id", "fabio-id"].map(
      (id) => ghostOf(id)[0]?.to,
    );
    expect(points[0]).toEqual(middle);
    expect(new Set(points.map((p) => p?.x)).size).toBe(3);
    for (const point of points) {
      expect(point?.y).toBe(0.5);
      expect(Math.abs((point?.x ?? 0) - 0.5)).toBeLessThanOrEqual(0.1);
    }
  });

  it("puts a new Ghost in a free place, even after another was put away", () => {
    const { room, ghostOf } = meeting();
    room.join("fabio-id", "Fábio");
    room.becomeObserver("fabio-id");
    room.summonGhost("davi-id", coral);
    room.summonGhost("eva-id", coral);
    room.dismissGhost("davi-id");

    room.summonGhost("fabio-id", coral);

    expect(ghostOf("fabio-id")[0]?.to).not.toEqual(ghostOf("eva-id")[0]?.to);
  });

  it("finds every Ghost of a full Room a place of its own within reach", () => {
    const room = createRoom();
    const ids = Array.from({ length: 30 }, (_, i) => `observer-${i}`);
    for (const id of ids) {
      room.join(id, id);
      room.becomeObserver(id);
      room.summonGhost(id, coral);
    }

    const points = room
      .snapshotFor(ids[0] ?? "")
      .participants.map((p) => p.ghost?.to);
    expect(new Set(points.map((p) => `${p?.x},${p?.y}`)).size).toBe(30);
    for (const point of points) {
      expect(point?.x).toBeGreaterThanOrEqual(-0.5);
      expect(point?.x).toBeLessThanOrEqual(1.5);
      expect(point?.y).toBeGreaterThanOrEqual(-0.5);
      expect(point?.y).toBeLessThanOrEqual(1.5);
    }
  });

  it.each([
    ["a Voter", "ana-id", coral, "voter-cannot-have-ghost"],
    ["someone who isn't in the Room", "stranger-id", coral, "not-in-room"],
    [
      "an unknown fabric",
      "eva-id",
      { fabric: "plaid", disguise: "none" },
      "not-a-skin",
    ],
    [
      "an unknown disguise",
      "eva-id",
      { fabric: "coral-stripes", disguise: "pirate" },
      "not-a-skin",
    ],
    ["no Skin at all", "eva-id", null, "not-a-skin"],
    ["a Skin that isn't an object", "eva-id", "coral-stripes", "not-a-skin"],
    [
      "an Observer whose Ghost is already out",
      "davi-id",
      coral,
      "ghost-already-out",
    ],
  ] as const)(
    "rejects summoning a Ghost by %s, leaving the Room unchanged",
    (_, id, skin, reason) => {
      const { room, onChange, snapshots } = meeting();
      room.summonGhost("davi-id", coral);
      onChange.mockClear();
      const before = snapshots();

      expect(room.summonGhost(id, skin)).toEqual({ ok: false, reason });

      expect(onChange).not.toHaveBeenCalled();
      expect(snapshots()).toEqual(before);
    },
  );

  it("goes away for everyone when its owner puts it away, back to the Watching line", () => {
    const { room, onChange, ghostOf } = meeting();
    room.summonGhost("davi-id", coral);
    onChange.mockClear();

    expect(room.dismissGhost("davi-id")).toEqual({ ok: true });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(ghostOf("davi-id")).toEqual(Array(4).fill(null));
  });

  it.each([
    ["an Observer with no Ghost out", "eva-id", "no-ghost"],
    ["a Voter", "ana-id", "no-ghost"],
    ["someone who isn't in the Room", "stranger-id", "not-in-room"],
  ] as const)(
    "rejects putting away a Ghost by %s, leaving the Room unchanged",
    (_, id, reason) => {
      const { room, onChange, snapshots } = meeting();
      room.summonGhost("davi-id", coral);
      onChange.mockClear();
      const before = snapshots();

      expect(room.dismissGhost(id)).toEqual({ ok: false, reason });

      expect(onChange).not.toHaveBeenCalled();
      expect(snapshots()).toEqual(before);
    },
  );

  it("is put away when its owner becomes a Voter, and stays away if they go back to observing", () => {
    const { room, ghostOf } = meeting();
    room.summonGhost("davi-id", coral);

    room.becomeVoter("davi-id");
    expect(ghostOf("davi-id")).toEqual(Array(4).fill(null));

    room.becomeObserver("davi-id");
    expect(ghostOf("davi-id")).toEqual(Array(4).fill(null));
  });

  it("leaves with its owner", () => {
    const { room } = meeting();
    room.summonGhost("davi-id", coral);

    room.leave("davi-id");
    room.join("davi-id", "Davi");
    room.becomeObserver("davi-id");

    expect(room.snapshotFor("ana-id").participants.at(-1)).toEqual(
      participant("davi-id", "Davi", { role: "observer" }),
    );
  });

  it("stays out, away, while its owner's connection is down, and is back as it was when they reconnect", () => {
    const { room, ghostOf } = meeting();
    room.summonGhost("eva-id", coral);
    room.summonGhost("davi-id", coral);
    const [shown] = ghostOf("davi-id");

    room.disconnect("davi-id");
    vi.advanceTimersByTime(29_999);
    const away = room
      .snapshotFor("ana-id")
      .participants.find((p) => p.id === "davi-id");
    expect(away).toMatchObject({ connected: false, ghost: shown });

    room.join("davi-id", "Davi");
    vi.advanceTimersByTime(1);
    expect(ghostOf("davi-id")).toEqual(Array(4).fill(shown));
  });

  it("goes when its owner's grace period runs out", () => {
    const { room } = meeting();
    room.summonGhost("davi-id", coral);

    room.disconnect("davi-id");
    vi.advanceTimersByTime(30_000);
    room.join("davi-id", "Davi");

    expect(
      room.snapshotFor("ana-id").participants.find((p) => p.id === "davi-id")
        ?.ghost,
    ).toBeNull();
  });

  it("can be seen by someone who joins after it was summoned", () => {
    const { room } = meeting();
    room.summonGhost("davi-id", coral);

    room.join("carla-id", "Carla");

    expect(
      room.snapshotFor("carla-id").participants.find((p) => p.id === "davi-id")
        ?.ghost,
    ).toEqual({ skin: coral, to: middle });
  });

  describe("Skins", () => {
    const berryNinja = { fabric: "berry-gingham", disguise: "ninja" } as const;

    it("can be summoned in any fabric and disguise", () => {
      const { room, ghostOf } = meeting();
      const nightRogue = { fabric: "night-stars", disguise: "rogue" } as const;

      expect(room.summonGhost("davi-id", nightRogue)).toEqual({ ok: true });

      expect(ghostOf("davi-id")).toEqual(
        Array(4).fill({ skin: nightRogue, to: middle }),
      );
    });

    it("re-dresses a Ghost that's out, for everyone, where it stands", () => {
      const { room, onChange, ghostOf } = meeting();
      room.summonGhost("eva-id", coral);
      room.summonGhost("davi-id", coral);
      vi.advanceTimersByTime(1000);
      room.moveGhost("davi-id", { x: 0.2, y: 0.8 });
      onChange.mockClear();

      expect(room.dressGhost("davi-id", berryNinja)).toEqual({ ok: true });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(ghostOf("davi-id")).toEqual(
        Array(4).fill({ skin: berryNinja, to: { x: 0.2, y: 0.8 } }),
      );
      expect(ghostOf("eva-id")[0]?.skin).toEqual(coral);
    });

    it("lets two Observers wear the same Skin", () => {
      const { room, ghostOf } = meeting();
      room.summonGhost("davi-id", coral);

      expect(room.summonGhost("eva-id", berryNinja)).toEqual({ ok: true });
      expect(room.dressGhost("davi-id", berryNinja)).toEqual({ ok: true });

      expect(ghostOf("davi-id")[0]?.skin).toEqual(berryNinja);
      expect(ghostOf("eva-id")[0]?.skin).toEqual(berryNinja);
    });

    it.each([
      ["an Observer with no Ghost out", "eva-id", berryNinja, "no-ghost"],
      ["a Voter", "ana-id", berryNinja, "no-ghost"],
      [
        "someone who isn't in the Room",
        "stranger-id",
        berryNinja,
        "not-in-room",
      ],
      [
        "an unknown fabric",
        "davi-id",
        { fabric: "plaid", disguise: "ninja" },
        "not-a-skin",
      ],
      [
        "an unknown disguise",
        "davi-id",
        { fabric: "berry-gingham", disguise: "pirate" },
        "not-a-skin",
      ],
      [
        "a fabric that's only on an object's prototype",
        "davi-id",
        { fabric: "toString", disguise: "none" },
        "not-a-skin",
      ],
      ["no Skin at all", "davi-id", undefined, "not-a-skin"],
    ] as const)(
      "rejects dressing a Ghost by %s, leaving the Room unchanged",
      (_, id, skin, reason) => {
        const { room, onChange, snapshots } = meeting();
        room.summonGhost("davi-id", coral);
        onChange.mockClear();
        const before = snapshots();

        expect(room.dressGhost(id, skin)).toEqual({ ok: false, reason });

        expect(onChange).not.toHaveBeenCalled();
        expect(snapshots()).toEqual(before);
      },
    );

    it("keeps only the fabric and disguise of what it was sent", () => {
      const { room, ghostOf } = meeting();
      room.summonGhost("davi-id", coral);

      room.dressGhost("davi-id", { ...berryNinja, hat: "crown" });

      expect(ghostOf("davi-id")[0]?.skin).toEqual(berryNinja);
    });
  });

  describe("walking", () => {
    /** Davi's Ghost is out; `moves` hears every accepted move. */
    function walking() {
      const m = meeting();
      m.room.summonGhost("davi-id", coral);
      m.onChange.mockClear();
      const moves = vi.fn();
      m.room.subscribeToGhosts(moves);
      return { ...m, moves };
    }

    it("tells the ghost subscriber once and sends no snapshot, and the next snapshot carries the destination", () => {
      const { room, onChange, snapshots, ghostOf, moves } = walking();
      const before = snapshots();

      expect(room.moveGhost("davi-id", { x: 0.2, y: 0.9 })).toEqual({
        ok: true,
      });

      expect(moves).toHaveBeenCalledTimes(1);
      expect(moves).toHaveBeenCalledWith({
        id: "davi-id",
        to: { x: 0.2, y: 0.9 },
      });
      expect(onChange).not.toHaveBeenCalled();
      // A snapshot already sent isn't changed under its holder.
      expect(
        before[0]?.participants.find((p) => p.id === "davi-id")?.ghost,
      ).toEqual({ skin: coral, to: middle });

      room.join("carla-id", "Carla");
      expect(ghostOf("davi-id")).toEqual(
        Array(4).fill({ skin: coral, to: { x: 0.2, y: 0.9 } }),
      );
    });

    it("reaches as far as the room area around the Table, on any screen", () => {
      const { room, moves } = walking();

      expect(room.moveGhost("davi-id", { x: -0.5, y: 1.5 })).toEqual({
        ok: true,
      });
      expect(room.moveGhost("davi-id", { x: 1.5, y: -0.5 })).toEqual({
        ok: true,
      });
      expect(moves).toHaveBeenCalledTimes(2);
    });

    it.each([
      [
        "someone who isn't in the Room",
        "stranger-id",
        { x: 0.2, y: 0.2 },
        "not-in-room",
      ],
      [
        "an Observer with no Ghost out",
        "eva-id",
        { x: 0.2, y: 0.2 },
        "no-ghost",
      ],
      ["a Voter", "ana-id", { x: 0.2, y: 0.2 }, "no-ghost"],
      ["a point past the left", "davi-id", { x: -0.51, y: 0.2 }, "not-a-point"],
      [
        "a point past the bottom",
        "davi-id",
        { x: 0.2, y: 1.51 },
        "not-a-point",
      ],
      [
        "a point that isn't a number",
        "davi-id",
        { x: "0.2", y: 0.2 },
        "not-a-point",
      ],
      [
        "a point that isn't finite",
        "davi-id",
        { x: NaN, y: 0.2 },
        "not-a-point",
      ],
      ["a missing coordinate", "davi-id", { x: 0.2 }, "not-a-point"],
      ["no point at all", "davi-id", null, "not-a-point"],
      ["a point that isn't an object", "davi-id", 0.2, "not-a-point"],
    ] as const)(
      "rejects a move by %s, leaving the Room unchanged",
      (_, id, to, reason) => {
        const { room, onChange, snapshots, moves } = walking();
        const before = snapshots();

        expect(room.moveGhost(id, to)).toEqual({ ok: false, reason });

        expect(moves).not.toHaveBeenCalled();
        expect(onChange).not.toHaveBeenCalled();
        expect(snapshots()).toEqual(before);
      },
    );

    it("allows a burst of 10 moves, then one more every 100 ms", () => {
      const { room, moves, snapshots } = walking();
      for (let i = 0; i < 10; i++)
        expect(room.moveGhost("davi-id", { x: i / 10, y: 0.5 })).toEqual({
          ok: true,
        });
      const before = snapshots();

      expect(room.moveGhost("davi-id", { x: 1, y: 1 })).toEqual({
        ok: false,
        reason: "moves-used-up",
      });
      expect(snapshots()).toEqual(before);
      vi.advanceTimersByTime(99);
      expect(room.moveGhost("davi-id", { x: 1, y: 1 })).toEqual({
        ok: false,
        reason: "moves-used-up",
      });
      vi.advanceTimersByTime(1);
      expect(room.moveGhost("davi-id", { x: 1, y: 1 })).toEqual({ ok: true });

      expect(moves).toHaveBeenCalledTimes(11);
    });

    it("keeps moves on a budget of their own, apart from Reactions and Throws", () => {
      const { room } = walking();
      room.summonGhost("eva-id", coral);
      for (let i = 0; i < 10; i++) room.moveGhost("davi-id", middle);

      for (let i = 0; i < 3; i++)
        expect(room.throwAt("davi-id", "ana-id", "rock")).toEqual({ ok: true });
      for (let i = 0; i < 10; i++)
        expect(room.moveGhost("eva-id", middle)).toEqual({ ok: true });
    });

    it("stops telling a subscriber once they unsubscribe", () => {
      const { room } = walking();
      const moves = vi.fn();
      const unsubscribe = room.subscribeToGhosts(moves);

      unsubscribe();
      room.moveGhost("davi-id", middle);

      expect(moves).not.toHaveBeenCalled();
    });
  });

  it("changes nothing in the Round, before or after the Reveal", () => {
    const { room, snapshots } = meeting();
    room.vote("ana-id", 8);
    const withoutGhost = (ss: RoomSnapshot[]) =>
      ss.map((s) => ({
        ...s,
        participants: s.participants.map((p) => ({ ...p, ghost: null })),
      }));
    const voting = withoutGhost(snapshots());

    expect(room.summonGhost("davi-id", coral)).toEqual({ ok: true });
    expect(withoutGhost(snapshots())).toEqual(voting);

    room.reveal("ana-id");
    const revealed = withoutGhost(snapshots());
    expect(room.dismissGhost("davi-id")).toEqual({ ok: true });
    expect(room.summonGhost("davi-id", coral)).toEqual({ ok: true });
    expect(withoutGhost(snapshots())).toEqual(revealed);
  });
});
