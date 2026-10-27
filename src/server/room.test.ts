import { describe, expect, it, vi } from "vitest";
import { createRoom } from "./room.js";

describe("joining the Room", () => {
  it("lists a Participant who joins, as a Voter", () => {
    const room = createRoom();

    expect(room.join("ana-id", "Ana")).toEqual({ ok: true });

    expect(room.snapshotFor("ana-id").participants).toEqual([
      { id: "ana-id", name: "Ana", role: "voter", isFacilitator: true },
    ]);
  });
});

describe("the Facilitator", () => {
  it("is the first Participant to join an empty Room, as seen by everyone", () => {
    const room = createRoom();
    room.join("ana-id", "Ana");
    room.join("bruno-id", "Bruno");

    const expected = [
      { id: "ana-id", name: "Ana", role: "voter", isFacilitator: true },
      { id: "bruno-id", name: "Bruno", role: "voter", isFacilitator: false },
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
      { id: "ana-id", name: "ana", role: "voter", isFacilitator: true },
      { id: "bruno-id", name: "Bruno", role: "voter", isFacilitator: false },
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
