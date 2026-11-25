import { describe, expect, it } from "vitest";
import { holdoutOf } from "./holdout.js";
import type { ParticipantRole } from "./protocol.js";

function voter(id: string, hasVoted: boolean) {
  return { id, role: "voter" as ParticipantRole, hasVoted };
}

function observer(id: string) {
  return { id, role: "observer" as ParticipantRole, hasVoted: false };
}

describe("the Holdout", () => {
  it("is the one Voter who hasn't voted", () => {
    expect(
      holdoutOf(
        [voter("ana", true), voter("bruno", false), voter("caio", true)],
        false,
      ),
    ).toBe("bruno");
  });

  it("is nobody while two or more Voters haven't voted", () => {
    expect(
      holdoutOf(
        [voter("ana", true), voter("bruno", false), voter("caio", false)],
        false,
      ),
    ).toBeNull();
  });

  it("is nobody once every Voter has voted", () => {
    expect(
      holdoutOf([voter("ana", true), voter("bruno", true)], false),
    ).toBeNull();
  });

  it("is nobody after the Reveal", () => {
    expect(
      holdoutOf([voter("ana", true), voter("bruno", false)], true),
    ).toBeNull();
  });

  it("never counts Observers", () => {
    expect(
      holdoutOf(
        [voter("ana", true), observer("olga"), voter("bruno", false)],
        false,
      ),
    ).toBe("bruno");
    expect(holdoutOf([voter("ana", true), observer("olga")], false)).toBeNull();
  });

  it("can be the only Voter in the Room", () => {
    expect(holdoutOf([voter("ana", false), observer("olga")], false)).toBe(
      "ana",
    );
  });

  it("still counts a Voter who is away", () => {
    const away = { ...voter("bruno", false), connected: false };
    expect(holdoutOf([voter("ana", true), away], false)).toBe("bruno");
  });
});
