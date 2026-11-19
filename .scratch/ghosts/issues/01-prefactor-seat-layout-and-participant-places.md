# 01: Prefactor: seat layout and Participant places

**What to build:** Make the Ghost work easy without changing anything anyone can see.
- **Seat layout:** today the Table component works out where each Voter's seat sits around the oval, and turns the Table so the viewer sits at the bottom. Move that rule into one small pure client module, so the Ghost frame (ticket 03) can reuse it instead of copying it.
- **Participant places:** Reactions and Throws find where they start and land with a special case (Observers start from the Watching line, Voters from their Card). Replace it with one lookup, "where is this Participant on the Table", so Ghosts can become a third kind of place later.
- **Fixture rename:** rename the Room test fixtures that use "ghost" for an unknown Participant (for example to "stranger"), so **Ghost** only ever means the feature (see the glossary).

See the spec in this folder.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Seat positions and the viewer's turn come from one pure module that the Table uses. The Table looks and behaves exactly as before.
- [ ] Unit tests for the seat layout module: the viewer's seat is at the bottom; seats are evenly spaced in Room order after the viewer; Observers (not seated) get the Room order with the first Voter at the bottom. Prior art: the existing client vote-marks tests.
- [ ] Reactions and Throws find their start and target through a single Participant-place lookup. Observers' Throws still start from the Watching line, and everything animates as before.
- [ ] No test fixture or test name uses "ghost" for anything but the feature.
- [ ] All existing tests, typecheck and lint pass.
