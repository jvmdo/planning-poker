# 03: Walk the Ghost

**What to build:** An Observer walks their Ghost anywhere in the room area, and everyone sees it walk there.
- **Input:** click or tap empty room space, or press the arrow keys (a hop of a tenth of the Table) from anywhere on the page, except where focus needs them (a text field, a dialog, a control that uses arrow keys itself) or with a modifier key held.
- **Walking:** at a steady speed (one Table width in about 1.5 s) with a gentle start and stop. The owner's Ghost starts moving on the click, before the server answers.
- **Same Card on every screen:** a Ghost over Bruno's Card is over Bruno's Card on every screen, Bruno's included. Positions live on the shared Table, and each Voter's screen turns them the way it turns the seats.
- **Where it can go:** each screen keeps the Ghost inside its own room area. Ghosts stay out of the sidebar and status bar, and pass under the Hand and toasts.
- **Move limit:** held keys and rapid clicks are capped.
- **Bots:** the scenario script gains bot Observers whose Ghosts wander, for checking by hand.

Only the destination crosses the network; each screen animates the walk itself. See the spec in this folder (user stories 24–25, 28–39) and the walking demo in the art prototype.

**Blocked by:** 02

**Status:** closed

- [x] Room: `moveGhost(id, to)`, rejected with no Ghost, a point that isn't two finite numbers from −0.5 to 1.5, or the move limit spent. A rejected move leaves the Room unchanged.
- [x] Move limit: a burst of 10 moves, then one more every 100 ms, on its own budget separate from Reactions and Throws (fake-timer tests in the style of the existing burst-limit tests).
- [x] An accepted move sends no snapshot. It reaches a ghost subscriber once, as a one-off event, and the next snapshot carries the latest destination for late joiners.
- [x] The adapter broadcasts `ghostMoved` within the Room. The client shows no toast for a rejected move.
- [x] A pure Ghost frame module, built on ticket 01's seat layout, converts between the shared Table and a screen: map onto a unit circle, turn by the viewer's seat, map back, clamp to the room area. Screen to Table is the reverse.
- [x] Ghost frame tests: a point over seat i lands over seat i on every Voter's screen for several Room sizes; converting there and back gives the same point; clamping keeps points inside the room area.
- [x] Clicks on seats, Cards, controls and the Hand keep their current behaviour and never move the Ghost.
- [x] The walk is animated frame by frame at a constant speed measured on the shared Table, easing in and out. A new destination mid-walk continues smoothly from where the Ghost is drawn.
- [x] Checked by hand: with three Voters and one bot Observer, the Ghost parked on one Voter's Card sits on that Card in every Voter's browser.

## Comments

**Implemented (2026-11-23).** Choices worth knowing:
- **Walking** is a small steering model in `src/client/lib/ghost-walker.ts`, not a fixed-length tween: the Ghost speeds up over 0.3 s, cruises at one Table width per 1.5 s and slows to a stop exactly at its destination. A new destination mid-walk keeps its current speed and turns towards it, so a held arrow key walks smoothly instead of stuttering. Walks run on the shared Table (so every screen takes the same time) and are drawn straight onto the Ghost's element each frame, without re-rendering.
- **The room area** each screen keeps Ghosts in is the Table section, kept in by enough pixels that the whole Ghost and its name tag stay visible. A Ghost held in at one screen's edge sets off from where it's drawn on its next move.
- **Arrow keys** hop a tenth of the Table from where the Ghost is heading, not where it's drawn, so a held key goes in a straight line.
- **The move limit** also runs in the browser, as for Reactions and Throws: moves past the budget aren't sent. A refused move just drops the Ghost's pending destination, without a toast.
- **Your own moves** show at once and stay until the server sends them back, so a snapshot arriving in between doesn't pull the Ghost back.
- **A click that closes an open menu** doesn't also walk your Ghost.
- **Reduced motion:** walks jump straight to the destination.
- **Bots:** `scripts/scenarios.ts` adds bot Observers (`--ghosts 0-4`, default 1) whose Ghosts wander, and now and then park on a Voter's Card, saying whose.
- `spendBurst` takes the budget's rule (`FUN_BURST` or `GHOST_MOVE_BURST`).

Checked in the browser (separate server): with Ana, Bruno and Carla voting on screens of three sizes, Davi observing, and a bot Observer's Ghost parked on Bruno's Card, it sat on Bruno's Card on all four screens, Bruno's included. Davi's Ghost walked to a click and others saw it there; three arrow presses moved it three tenths of the Table; clicking a seat didn't move it; a Ghost sent to the far corner stayed inside the narrow screen's room area, above the Hand.

**Closed (2026-11-23).**

**Arrow keys from anywhere (2026-11-23).** As first built, the arrow keys walked your Ghost only while it had focus, and nothing gave it focus: after summoning it focus was on the Ghost button, and after a click-to-walk on the page, so the keys looked broken. They now work from anywhere on the page, unless focus is in a text field, a dialog or a control that uses arrow keys itself, or a modifier key is held. Your Ghost is no longer focusable. The spec's Input line says the same. Checked in the browser: → right after summoning, ↓ after a click-to-walk, Shift+← ignored, ← ignored while typing in the Deck dialog.

**Walking over the strip under the Table (2026-11-24).** Ghosts were kept to the Table section, out of the strip under it. Observers have no Hand, so the room area now takes in that strip: an Observer can click there, or walk down with the arrow keys, and their Ghost goes over the "You're observing" note and the breakdown after the Reveal. A Voter's Hand still stays above every Ghost, so a Ghost never blocks a vote. On a short screen the strip reaches about 1.7 Table heights down, so a Ghost's reach on the shared Table grew from −0.5…1.5 to −1…2. The spec's Room area, Ghost layer and shared Table lines say the same.

**Down to the bottom edge (2026-11-24).** The room area kept 16px free under every Ghost for its name tag, but the tag now shows only with the Ghost's menu, so Ghosts stopped short of the bottom with a gap nothing filled. That reserve is gone, and the tag sits between the Ghost and its menu, on the side the menu opens. A Ghost low on the screen opens its menu upwards, so its tag stays on screen.
