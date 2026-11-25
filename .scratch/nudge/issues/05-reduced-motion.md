# 05: Nudges with reduced motion

**What to build:** Nudges for people who have `prefers-reduced-motion` turned on.
- **The Holdout:** a brief red flash around the page's edge instead of the shake, plus `navigator.vibrate` where the browser supports it.
- **Everyone else:** a static highlight on the Holdout's seat Card instead of the rumble, and no cracks.
- **Unchanged:** the buzz and the toasts.

See the spec in this folder: user story 14 and the client's **Reduced motion** bullet. The app already checks reduced motion in `src/client/use-venting.ts` and `src/client/lib/ghost-walker.ts`, and uses `motion-reduce:` variants in CSS.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Holdout with reduced motion: no shake, a red edge flash whose strength or length can follow the level, and a vibration where supported.
- [ ] Others with reduced motion: no rumble or cracks, just a static highlight on the seat.
- [ ] Buzz and toasts are unchanged.
- [ ] Checked in a browser with reduced motion emulated, from both the Holdout's and another Participant's side.
