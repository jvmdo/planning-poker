import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadIdentity,
  roleIn,
  updateIdentity,
  withRoleIn,
} from "./identity.js";

const KEY = "planning-poker:identity";
const coralNinja = { fabric: "coral-stripes", disguise: "ninja" } as const;

/** A browser's storage, as plain as `localStorage`. */
function fakeStorage(entries: Record<string, string> = {}) {
  const store = new Map(Object.entries(entries));
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
  };
}

function storing(identity: unknown) {
  vi.stubGlobal(
    "localStorage",
    fakeStorage({ [KEY]: JSON.stringify(identity) }),
  );
}

describe("the Ghost a browser remembers", () => {
  beforeEach(() => vi.stubGlobal("localStorage", fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("is none for a new browser", () => {
    expect(loadIdentity().ghost).toBeNull();
  });

  it("is none for an identity stored before Ghosts were remembered", () => {
    storing({ id: "p1", name: "Ana", lastRoom: null });
    expect(loadIdentity()).toMatchObject({
      id: "p1",
      name: "Ana",
      ghost: null,
    });
  });

  it("is the Skin picked, kept alongside the rest of the identity", () => {
    storing({ id: "p1", name: "Ana", lastRoom: null });
    updateIdentity((stored) => ({ ...stored, ghost: coralNinja }));
    expect(loadIdentity()).toMatchObject({
      id: "p1",
      name: "Ana",
      ghost: coralNinja,
    });
  });

  it("is forgotten once the Ghost is put away", () => {
    storing({ id: "p1", name: "Ana", lastRoom: null, ghost: coralNinja });
    updateIdentity((stored) => ({ ...stored, ghost: null }));
    expect(loadIdentity().ghost).toBeNull();
  });

  it("is none when what's stored isn't a Skin", () => {
    storing({
      id: "p1",
      name: "Ana",
      lastRoom: null,
      ghost: { fabric: "tartan", disguise: "ninja" },
    });
    expect(loadIdentity()).toMatchObject({ id: "p1", ghost: null });
  });

  it("is none when storage can't be read", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(loadIdentity().ghost).toBeNull();
  });
});

describe("the Rooms a browser is an Observer in", () => {
  beforeEach(() => vi.stubGlobal("localStorage", fakeStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it("are none for a new browser, so every Room starts it as a Voter", () => {
    expect(roleIn(loadIdentity(), "team-alpha")).toBe("voter");
  });

  it("include a Room once it's an Observer there, and only that Room", () => {
    updateIdentity((stored) => withRoleIn(stored, "team-alpha", "observer"));

    expect(roleIn(loadIdentity(), "team-alpha")).toBe("observer");
    expect(roleIn(loadIdentity(), "team-beta")).toBe("voter");
  });

  it("drop a Room once it's a Voter there again", () => {
    updateIdentity((stored) => withRoleIn(stored, "team-alpha", "observer"));
    updateIdentity((stored) => withRoleIn(stored, "team-alpha", "voter"));

    expect(roleIn(loadIdentity(), "team-alpha")).toBe("voter");
  });

  it("keep only the 20 most recently used Rooms", () => {
    for (let n = 1; n <= 21; n++)
      updateIdentity((stored) => withRoleIn(stored, `room-${n}`, "observer"));
    // Used again, so it's recent.
    updateIdentity((stored) => withRoleIn(stored, "room-2", "observer"));
    updateIdentity((stored) => withRoleIn(stored, "room-22", "observer"));

    const identity = loadIdentity();
    expect(roleIn(identity, "room-1")).toBe("voter");
    expect(roleIn(identity, "room-3")).toBe("voter");
    expect(roleIn(identity, "room-2")).toBe("observer");
    expect(roleIn(identity, "room-4")).toBe("observer");
    expect(roleIn(identity, "room-22")).toBe("observer");
  });

  it("are none when what's stored isn't a list of Room IDs", () => {
    storing({
      id: "p1",
      name: "Ana",
      lastRoom: null,
      observerIn: "team-alpha",
    });
    expect(roleIn(loadIdentity(), "team-alpha")).toBe("voter");
  });

  it("keep the stored Room IDs that are valid, dropping the rest", () => {
    storing({
      id: "p1",
      name: "Ana",
      lastRoom: null,
      observerIn: [42, "team-beta"],
    });
    expect(roleIn(loadIdentity(), "team-beta")).toBe("observer");
  });

  it("are none, along with the rest, when storage can't be read", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(roleIn(loadIdentity(), "team-alpha")).toBe("voter");
  });
});
