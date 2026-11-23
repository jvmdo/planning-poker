# 07: Remember my Ghost

**What to build:** A browser remembers that its owner wants a Ghost, and in which Skin, in every Room, until they put it away themselves. Whenever this browser is an Observer with no Ghost out, its Ghost comes back out of a vent (ticket 08) in the remembered Skin. That covers:
- joining
- a reload
- the grace period running out
- a server restart
- switching back from Voter

Becoming a Voter, being removed or a restart never clears the memory; only putting the Ghost away ("Vent") does.

See the spec in this folder (user stories 12–15, 68).

**Blocked by:** 04

**Status:** ready-for-human

- [x] The identity the browser already stores (Participant ID, name, Last Room) also stores the wanted Skin, or none. Unreadable storage behaves as "no Ghost wanted".
- [x] Picking a Skin in the picker stores it, and "Vent" (putting the Ghost away) clears it.
- [x] After joining or rejoining as an Observer with a remembered Skin and no Ghost out, the browser summons one once. A refused summon is not retried in a loop.
- [x] A Voter with a remembered Skin who switches to Observer gets their Ghost back, out of a vent.
- [x] The memory applies across Rooms, like the name.
- [x] The picker opens with the remembered Skin selected instead of a random one.

## Comments

**2026-11-23, agent:** Done and checked in a real browser: pick → reload, Voter → Observer, a second Room, and Vent → reload all behave as described. The picker opens on the remembered Skin.

One gap for a human to decide. After the grace period runs out or the server restarts, the Room has no record of the Participant, so `join` in `src/server/room.ts` makes them a Voter (`existing?.role ?? "voter"`). The remembered Skin survives, and the Ghost comes back as soon as they switch to Observer. It does not come back on its own, because nothing remembers the *role*. If story 68 means it should, that needs a new ticket: remember Observer in the identity and rejoin as one. Otherwise, reword story 68 and this ticket.

A tab that's an Observer without a Ghost in another Room also brings its Ghost out once a Skin is picked in any tab ("in every Room"). That is intended by this ticket.

**2026-11-23, agent:** Decided: the browser remembers the Observer role for the Room it was an Observer in only, not in every Room. That is ticket 09 (`09-remember-observer-role.md`).
