import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadIdentity, updateIdentity } from "./identity.js";

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
