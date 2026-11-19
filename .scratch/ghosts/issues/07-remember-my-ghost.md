# 07: Remember my Ghost

**What to build:** A browser remembers that its owner wants a Ghost, and in which Skin, in every Room, until they put it away themselves. Whenever this browser is an Observer with no Ghost out, its Ghost comes back in the middle of the Table in the remembered Skin. That covers:
- joining
- a reload
- the grace period running out
- a server restart
- switching back from Voter

Becoming a Voter, being removed or a restart never clears the memory; only "Put Ghost away" does.

See the spec in this folder (user stories 12–15, 68).

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] The identity the browser already stores (Participant ID, name, Last Room) also stores the wanted Skin, or none. Unreadable storage behaves as "no Ghost wanted".
- [ ] Picking a Skin in the picker stores it, and "Put Ghost away" clears it.
- [ ] After joining or rejoining as an Observer with a remembered Skin and no Ghost out, the browser summons one once. A refused summon is not retried in a loop.
- [ ] A Voter with a remembered Skin who switches to Observer gets their Ghost back in the middle.
- [ ] The memory applies across Rooms, like the name.
- [ ] The picker opens with the remembered Skin selected instead of a random one.
