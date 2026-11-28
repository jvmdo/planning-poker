import { describe, expect, it } from "vitest";
import type { ParticipantView } from "../shared/protocol.js";
import { ghostComeback } from "./ghost-comeback.js";

const coralNinja = { fabric: "coral-stripes", disguise: "ninja" } as const;
const mintPlain = { fabric: "mint-dots", disguise: "none" } as const;

function me(overrides: Partial<ParticipantView> = {}): ParticipantView {
  return {
    id: "me",
    name: "Ana",
    role: "observer",
    isFacilitator: false,
    hasVoted: false,
    vote: null,
    connected: true,
    ghost: null,
    ...overrides,
  };
}

describe("bringing back the Ghost this browser remembers", () => {
  it("summons it in the remembered Skin for an Observer with no Ghost out", () => {
    expect(ghostComeback(false, me(), coralNinja, null)).toEqual({
      summon: coralNinja,
      tried: true,
    });
  });

  it("doesn't summon it again once tried, so a refusal isn't retried in a loop", () => {
    expect(ghostComeback(true, me(), coralNinja, null)).toEqual({
      summon: null,
      tried: true,
    });
  });

  it("summons nothing when no Ghost is wanted", () => {
    expect(ghostComeback(false, me(), null, null)).toEqual({
      summon: null,
      tried: false,
    });
  });

  it("summons nothing while the Ghost is already out", () => {
    const out = me({ ghost: { skin: mintPlain, to: { x: 0.5, y: 0.5 } } });
    expect(ghostComeback(false, out, coralNinja, null).summon).toBeNull();
  });

  it("leaves the Ghost to a change you've just asked for", () => {
    expect(
      ghostComeback(false, me(), coralNinja, { skin: mintPlain, roll: 0.5 })
        .summon,
    ).toBeNull();
    expect(ghostComeback(false, me(), coralNinja, "away").summon).toBeNull();
  });

  it("summons nothing for a Voter, and tries again once they're back as an Observer", () => {
    const asVoter = ghostComeback(
      true,
      me({ role: "voter" }),
      coralNinja,
      null,
    );
    expect(asVoter).toEqual({ summon: null, tried: false });
    expect(ghostComeback(asVoter.tried, me(), coralNinja, null).summon).toEqual(
      coralNinja,
    );
  });

  it("tries again after leaving the Room and joining it again", () => {
    const gone = ghostComeback(true, null, coralNinja, null);
    expect(gone).toEqual({ summon: null, tried: false });
    expect(ghostComeback(gone.tried, me(), coralNinja, null).summon).toEqual(
      coralNinja,
    );
  });
});
