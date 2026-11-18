import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_DECK } from "../shared/deck.js";
import { createRooms } from "./rooms.js";

describe("the Rooms registry", () => {
  it("creates a Room on its first join and returns the same Room to later joins", () => {
    const rooms = createRooms();

    const first = rooms.join("team-alpha", "ana-id", "Ana");
    const second = rooms.join("team-alpha", "bruno-id", "Bruno");

    expect(first.ok && second.ok && first.room === second.room).toBe(true);
    if (!second.ok) return;
    expect(
      second.room.snapshotFor("bruno-id").participants.map((p) => p.name),
    ).toEqual(["Ana", "Bruno"]);
  });

  it("keeps two Room IDs apart: a Vote in one never shows in the other's snapshots", () => {
    const rooms = createRooms();
    const alpha = rooms.join("team-alpha", "ana-id", "Ana");
    const beta = rooms.join("team-beta", "bruno-id", "Bruno");
    if (!alpha.ok || !beta.ok) throw new Error("both joins should succeed");

    alpha.room.vote("ana-id", 8);
    alpha.room.reveal("ana-id");

    expect(alpha.room).not.toBe(beta.room);
    const betaSnapshot = beta.room.snapshotFor("bruno-id");
    expect(betaSnapshot.participants.map((p) => p.name)).toEqual(["Bruno"]);
    expect(betaSnapshot.revealed).toBe(false);
    expect(betaSnapshot.result).toBeNull();
    expect(betaSnapshot.participants).toEqual([
      expect.objectContaining({ hasVoted: false, vote: null }),
    ]);
  });

  it("tells its subscribers about each Room once, when it is created", () => {
    const rooms = createRooms();
    const created: string[] = [];
    rooms.subscribeToNewRooms((roomId) => created.push(roomId));

    rooms.join("team-alpha", "ana-id", "Ana");
    rooms.join("team-alpha", "bruno-id", "Bruno");
    rooms.join("team-beta", "carla-id", "Carla");

    expect(created).toEqual(["team-alpha", "team-beta"]);
  });

  it("creates no Room when the first join is refused", () => {
    const rooms = createRooms();
    const created: string[] = [];
    rooms.subscribeToNewRooms((roomId) => created.push(roomId));

    expect(rooms.join("team-alpha", "ana-id", "  ")).toEqual({
      ok: false,
      reason: "name-empty",
    });

    expect(created).toEqual([]);
  });
});

describe("the Room cap", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A registry holding 100 Rooms, the most it takes, each with one Participant; and the first. */
  function fullRegistry() {
    const rooms = createRooms();
    const first = rooms.join("room-1", "p1-id", "Ana");
    if (!first.ok) throw new Error("the join should succeed");
    for (let n = 2; n <= 100; n++) rooms.join(`room-${n}`, `p${n}-id`, "Ana");
    return { rooms, first: first.room };
  }

  it("refuses to create a 101st Room", () => {
    const { rooms } = fullRegistry();
    const created: string[] = [];
    rooms.subscribeToNewRooms((roomId) => created.push(roomId));

    expect(rooms.join("room-101", "bruno-id", "Bruno")).toEqual({
      ok: false,
      reason: "server-full",
    });

    expect(created).toEqual([]);
  });

  it("still accepts joins to a Room that exists when the server is full", () => {
    const { rooms } = fullRegistry();

    const joined = rooms.join("room-1", "bruno-id", "Bruno");

    if (!joined.ok) throw new Error("the join should succeed");
    expect(
      joined.room.snapshotFor("bruno-id").participants.map((p) => p.name),
    ).toEqual(["Ana", "Bruno"]);
  });

  it("accepts a new Room once an empty one is removed", () => {
    const { rooms, first } = fullRegistry();
    first.leave("p1-id");

    vi.advanceTimersByTime(59_999);
    expect(rooms.join("room-101", "bruno-id", "Bruno")).toMatchObject({
      ok: false,
      reason: "server-full",
    });

    vi.advanceTimersByTime(1);
    expect(rooms.join("room-101", "bruno-id", "Bruno")).toMatchObject({
      ok: true,
    });
  });
});

describe("removing an empty Room", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A registry whose Room team-alpha has a Deck of its own, a later Round, and nobody in it. */
  function roomLeftEmpty() {
    const rooms = createRooms();
    const joined = rooms.join("team-alpha", "ana-id", "Ana");
    if (!joined.ok) throw new Error("the join should succeed");
    joined.room.setDeck("ana-id", [1, 2, 3]);
    return { rooms, room: joined.room };
  }

  it("keeps an empty Room for a minute: a join at 59 s finds it with its Deck and Round", () => {
    const { rooms, room } = roomLeftEmpty();
    room.leave("ana-id");
    const round = room.snapshotFor("ana-id").round;

    vi.advanceTimersByTime(59_999);
    const back = rooms.join("team-alpha", "bruno-id", "Bruno");

    expect(back.ok && back.room).toBe(room);
    expect(room.snapshotFor("bruno-id")).toMatchObject({
      deck: [1, 2, 3],
      round,
    });
  });

  it("removes an empty Room after a minute: its Room ID then gives a new Room with the default Deck", () => {
    const { rooms, room } = roomLeftEmpty();
    const created: string[] = [];
    rooms.subscribeToNewRooms((roomId) => created.push(roomId));
    room.leave("ana-id");

    vi.advanceTimersByTime(60_000);
    const back = rooms.join("team-alpha", "bruno-id", "Bruno");

    if (!back.ok) throw new Error("the join should succeed");
    expect(back.room).not.toBe(room);
    expect(back.room.snapshotFor("bruno-id").deck).toEqual(DEFAULT_DECK);
    expect(created).toEqual(["team-alpha"]);
  });

  it("starts the minute again each time the Room empties, after a join cancelled it", () => {
    const { rooms, room } = roomLeftEmpty();
    room.leave("ana-id");
    vi.advanceTimersByTime(59_000);
    rooms.join("team-alpha", "bruno-id", "Bruno");
    room.leave("bruno-id");

    vi.advanceTimersByTime(59_000);
    const back = rooms.join("team-alpha", "carla-id", "Carla");

    expect(back.ok && back.room).toBe(room);
  });

  it("counts a Participant in their grace period: the minute starts when it ends", () => {
    const { rooms, room } = roomLeftEmpty();
    room.disconnect("ana-id");

    vi.advanceTimersByTime(30_000 + 59_999);
    expect(room.isEmpty()).toBe(true);
    const back = rooms.join("team-alpha", "bruno-id", "Bruno");

    expect(back.ok && back.room).toBe(room);
  });

  it("removes the Room a minute after the last grace period ends", () => {
    const { rooms, room } = roomLeftEmpty();
    room.disconnect("ana-id");

    vi.advanceTimersByTime(30_000 + 60_000);
    const back = rooms.join("team-alpha", "bruno-id", "Bruno");

    expect(back.ok && back.room).not.toBe(room);
  });

  it("removes only the Room that emptied", () => {
    const { rooms, room } = roomLeftEmpty();
    const beta = rooms.join("team-beta", "bruno-id", "Bruno");
    room.leave("ana-id");

    vi.advanceTimersByTime(60_000);

    expect(rooms.join("team-beta", "carla-id", "Carla")).toEqual(beta);
  });
});
