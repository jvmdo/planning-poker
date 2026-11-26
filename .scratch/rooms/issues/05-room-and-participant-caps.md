# 05: Room and Participant caps

**What to build:** Since visiting any URL can create a Room, the server limits how many exist: at most 100 Rooms and 30 Participants per Room. The free instance's CPU, spent sending each Participant their own snapshot, is the real limit (ADR 0002). A join that would go past either cap is refused and the join screen says why.

**Blocked by:** 02 (A Room per URL)

**Status:** closed

- [x] The registry refuses to create the 101st Room with `server-full`. Existing Rooms still accept joins, and once a Room is removed a new one can be created.
- [x] The Room refuses a 31st Participant with `room-full`. A Participant already in the Room (including one in their grace period) can always rejoin.
- [x] Both are new join rejection reasons in the shared protocol. The join screen shows "The server is full, try again later." and "This Room is full."
- [x] Tests: 100 Rooms then a refused 101st; a join to an existing Room at the cap succeeds; a Room freed by removal (fake timers) makes room for a new one; a 31st Participant is refused and the Room is unchanged; a rejoin into a full Room succeeds.
- [x] The caps are named constants next to the module that enforces each.

## Comments

- 2026-11-26: closed by the human (was `ready-for-agent`), without re-checking each box here.
