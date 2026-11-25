# 03: Earthquake at the seat

**What to build:** everyone else sees the Nudge land. On every screen but the Holdout's:
- **Rumble:** the Holdout's seat Card rumbles with a fast side-to-side shudder, clearly different from a Throw's wobble.
- **Cracks:** a few jagged cracks spread across the Table from that seat and then fade. They get longer and more numerous with the level.

Each screen draws it at the Holdout's seat as that screen shows it, since a Voter's screen is turned so their own seat is at the bottom.

See the spec in this folder: user stories 15 and 21, and the client's **Earthquake at the seat** bullet.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The seat Card's rumble is a new animation, distinct from the Throw-hit wobble, and its strength scales with the level.
- [ ] Cracks are our own simple drawing in the app's ink colour. They start at the Holdout's seat, grow with the level, fade out, and never cover the Hand or toasts.
- [ ] A burst restarts the earthquake at the new level instead of stacking several.
- [ ] Checked in a browser: a turned Voter's screen, a phone width, dark mode, and Nudges at levels 1 and 5. Look and feel is a human check.
