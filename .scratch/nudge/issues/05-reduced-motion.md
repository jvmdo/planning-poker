# 05: Nudges with reduced motion

**What to build:** Nudges for people who have `prefers-reduced-motion` turned on.
- **The Holdout:** a brief red flash around the page's edge instead of the shake, plus `navigator.vibrate` where the browser supports it.
- **Everyone else:** a static highlight on the Holdout's seat Card instead of the rumble, and no cracks.
- **Unchanged:** the buzz and the toasts.

See the spec in this folder: user story 14 and the client's **Reduced motion** bullet. The app already checks reduced motion in `src/client/use-venting.ts` and `src/client/lib/ghost-walker.ts`, and uses `motion-reduce:` variants in CSS.

**Blocked by:** 03

**Status:** closed

- [x] Holdout with reduced motion: no shake, a red edge flash whose strength or length can follow the level, and a vibration where supported.
- [x] Others with reduced motion: no rumble or cracks, just a static highlight on the seat.
- [x] Buzz and toasts are unchanged.
- [x] Checked in a browser with reduced motion emulated, from both the Holdout's and another Participant's side.

## Comments

- Checked in a browser with reduced motion emulated, from the Holdout's side (phone width) and from another Voter's side.
  - **The Holdout:** the page doesn't move. Its edge flashes red, 5 px at level 1 up to 20 px at level 5, for as long as the shake would last. `navigator.vibrate` gets three equal buzzes over the same length, and is stopped when they vote. The buzz and the toast are unchanged.
  - **Everyone else:** the Holdout's seat Card gets a red ring (the `nudge-highlight` class) for as long as the earthquake would last, with no rumble and no cracks.
- Chromium only vibrates once the page has been tapped, so a Holdout who hasn't tapped feels nothing. "Where the browser supports it" covers this.
