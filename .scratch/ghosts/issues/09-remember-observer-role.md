# 09: Remember the Observer role

**What to build:** A browser remembers which Rooms its owner is an Observer in. When it joins one of those Rooms as someone the Room doesn't know, it joins as an Observer, not a Voter. With ticket 07, their Ghost then comes back on its own. Today an Observer whose grace period runs out, or whose Room is emptied by a server restart, comes back as a Voter. They lose their Ghost until they switch back.
- **Which Rooms:** only Rooms where this browser was an Observer. Joining any other Room still starts as a Voter. Being an Observer in one team's meeting must not stop you voting in another's.
- **When it applies:** every join the Room treats as new:
  - after the grace period runs out;
  - after a server restart;
  - after Leave and joining again;
  - after a reload once the Room has forgotten you.

  A reconnect within the grace period keeps whatever role the Room still has, as it does today.
- **Remembering and forgetting:** the Room is remembered once a snapshot shows you as an Observer in it, and forgotten once a snapshot shows you as a Voter there. A refused switch changes nothing. Leaving keeps the memory.
- **No Voter flash:** you arrive as an Observer in one step. You are never a Voter for a moment, so nobody's "waiting on" count blinks.

See the spec in this folder (user stories 14a and 68).

**Blocked by:** 07

**Status:** closed

- [x] The browser's identity (`src/client/lib/identity.ts`) also stores the Room IDs it's an Observer in. Keep at most the 20 most recently used, so storage doesn't grow forever. Unreadable or malformed storage means none. Tested like the remembered Skin in `identity.test.ts`.
- [x] `join` takes the role to arrive with, as untrusted input, in the protocol (`ClientToServerEvents.join`), the adapter, `rooms.join` and `room.join`. Only `"observer"` makes a new Participant an Observer. Anything else, including a missing role from a tab loaded before this change, means Voter. A Participant the Room still has (within the grace period, or a second tab) keeps their current role, whatever the join says.
- [x] Room scenario tests in `src/server/room.test.ts`:
  - a new Participant joining as an Observer is one, with no Vote expected;
  - a junk role joins as a Voter;
  - a rejoin within the grace period keeps the role the Room has, whatever the join asks for;
  - a rejoin after the grace period runs out as an Observer comes back as one;
  - the first Participant in an empty Room still becomes the Facilitator when joining as an Observer.
- [x] The browser sends the remembered role on every join and rejoin (`useRoom` in `src/client/use-room.ts`). It updates the memory from snapshots, the same way Last Room is updated.
- [x] Checked by hand: switch to Observer with a Ghost, then restart the server. You come back as an Observer and your Ghost comes back. The same holds after Leave and rejoining. A different Room still starts you as a Voter. Switching to Voter and restarting brings you back as a Voter.

## Notes for whoever picks this up

- **Why Voters today:** `join` in `src/server/room.ts` sets `role: existing?.role ?? "voter"`. Once the Room has forgotten the Participant there is no `existing`.
- **The Ghost needs no work here:** ticket 07's `ghostComeback` (`src/client/ghost-comeback.ts`) already summons the remembered Ghost whenever a snapshot shows you as an Observer without one.
- **A Vote set aside during the grace period:** `join` puts back a Vote set aside for a returning Participant (`setAside`). An Observer has no Vote, so joining as an Observer must not restore one.

## Comments

**2026-11-23, agent:** Done. Checked in a real browser on an isolated server:
- Observer with a Ghost → server restart: back as an Observer, Ghost back.
- Leave and rejoin: back as an Observer, Ghost back.
- Another Room: starts as a Voter.
- Voter → server restart: back as a Voter.

Grace-period expiry is covered by the Room tests. Two choices made along the way:
- Stored Room IDs that aren't valid are dropped and the valid ones kept, the same way other stored fields are read.
- The memory is written only when the role a snapshot shows differs from what's remembered, so tabs don't keep rewriting storage. "Most recently used" therefore means most recently *became* an Observer there.
