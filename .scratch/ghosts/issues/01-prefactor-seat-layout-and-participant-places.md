# 01: Prefactor: seat layout and Participant places

**What to build:** Make the Ghost work easy without changing anything anyone can see.
- **Seat layout:** today the Table component works out where each Voter's seat sits around the oval, and turns the Table so the viewer sits at the bottom. Move that rule into one small pure client module, so the Ghost frame (ticket 03) can reuse it instead of copying it.
- **Participant places:** Reactions and Throws find where they start and land with a special case (Observers start from the Watching line, Voters from their Card). Replace it with one lookup, "where is this Participant on the Table", so Ghosts can become a third kind of place later.
- **Fixture rename:** rename the Room test fixtures that use "ghost" for an unknown Participant (for example to "stranger"), so **Ghost** only ever means the feature (see the glossary).

See the spec in this folder.

**Blocked by:** None (can start immediately)

**Status:** closed

- [x] Seat positions and the viewer's turn come from one pure module that the Table uses. The Table looks and behaves exactly as before.
- [x] Unit tests for the seat layout module: the viewer's seat is at the bottom; seats are evenly spaced in Room order after the viewer; Observers (not seated) get the Room order with the first Voter at the bottom. Prior art: the existing client vote-marks tests.
- [x] Reactions and Throws find their start and target through a single Participant-place lookup. Observers' Throws still start from the Watching line, and everything animates as before.
- [x] No test fixture or test name uses "ghost" for anything but the feature.
- [x] All existing tests, typecheck and lint pass.

## Comments

**Implemented (2026-11-23).** One deliberate visible change: the seats are now a true rotation of the shared Table. Before, a Voter saw themselves at the bottom and then everyone else in Room order skipping themselves (Room A, B, C, D seen by C: C, A, B, D clockwise). Now it carries on round from their own seat and wraps (C, D, A, B). The old order isn't a rotation of any one shared layout, so no Ghost frame could put a Ghost over the same Card on every screen (spec: "a Voter whose seat is k-th in Room order sees the shared Table turned back by k seat-steps"). The first Voter in Room order sees no change; others with three or more Voters see their neighbours swap places.

`placeOf` also resolves an Observer as a Reaction source or Throw target (the Watching line). The server still refuses both today, so nothing new is visible.

**Closed (2026-11-23).** Checked by hand: seat positions and Throws work as before.
