# 06: Hop, punch and shout

**What to build:** more for the Holdout to see when they're Nudged, on top of the shake (the prototype's mix "F"):
- **Hop:** their Hand's Cards hop up one after another.
- **Punch:** the whole page punches towards them from their Hand.
- **Shout:** comic words pop out over the Table, "psst" up to "VOTE!!!", one more per level. The last lands in the Table's middle.

All three grow with the level and stop when the Holdout votes or the Round is Revealed.

See the spec in this folder: user story 26 and the client's **Round the shake** bullet.

**Prototype:** branch `prototype/holdout-nudge` (never merged). It holds six variants on any Room's URL in a dev build, switched with `?variant=A`…`F`:
- A: Hand wave
- B: Poking fingers
- C: Spotlight
- D: Zoom punch
- E: Comic shout
- F: A, D and E together

The verdict: F, the mix of A, D and E, with two changes made along the way:
- the shout's words pop out at random places, all but the last, which stays in the middle;
- the words go by the Table's area, not the whole window, so they follow the sidebar.

**Blocked by:** 05

**Status:** closed

- [x] The shout's words, one more per level and each sized for its own level, as a pure function with unit tests.
- [x] Hop, punch and shout play together on top of the shake, grow with the level, restart with a burst, and stop when the Holdout's Vote lands or the Round is Revealed.
- [x] The shout's words go by the Table's area, with the sidebar open or collapsed.
- [x] With reduced motion none of them play: the red flash stands for all of it.
- [x] Checked in a browser at level 5, with the sidebar open and collapsed, and with reduced motion.
