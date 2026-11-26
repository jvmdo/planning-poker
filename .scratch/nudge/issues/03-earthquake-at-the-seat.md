# 03: Earthquake at the seat

**What to build:** everyone else sees the Nudge land. On every screen but the Holdout's:
- **Rumble:** the Holdout's seat Card rumbles with a fast side-to-side shudder, clearly different from a Throw's wobble.
- **Cracks:** a few jagged cracks spread across the Table from that seat and then fade. They get longer and more numerous with the level.

Each screen draws it at the Holdout's seat as that screen shows it, since a Voter's screen is turned so their own seat is at the bottom.

See the spec in this folder: user stories 15 and 21, and the client's **Earthquake at the seat** bullet.

**Blocked by:** 02

**Status:** closed

- [x] The seat Card's rumble is a new animation, distinct from the Throw-hit wobble, and its strength scales with the level.
- [x] Cracks are our own simple drawing in the app's ink colour. They start at the Holdout's seat, grow with the level, fade out, and never cover the Hand or toasts.
- [x] A burst restarts the earthquake at the new level instead of stacking several.
- [x] Checked in a browser: a turned Voter's screen, a phone width, dark mode, and Nudges at levels 1 and 5. Look and feel is a human check.

## Comments

- Ran in a browser with real input: a turned Voter's screen in dark mode, an Observer at phone width, and the sender's own screen, at levels 1 and 5. The cracks start at the Holdout's seat as each screen shows it: 3 at level 1, 6 plus branches at level 5. They're clipped to the Table's oval and sit under the seats, so they never reach the Hand or the toast. A burst keeps a single crack layer, and every layer is removed once it fades. The Holdout's own screen shows no cracks.
- Like the Holdout's shake, the earthquake stops at once when the Holdout's Vote lands or the Round is Revealed.
- **For a human to look at:** whether the rumble reads clearly differently from a Throw's wobble, and how the cracks look. In dark mode they're near-black ink on the dark green Table: visible in the screenshots, but on the subtle side.
- With reduced motion, nothing plays for now. Ticket 05 adds the static highlight.
- Signed off by the human after trying it locally: the look and feel are fine.
