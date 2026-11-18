import { describe, expect, it } from "vitest";
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
