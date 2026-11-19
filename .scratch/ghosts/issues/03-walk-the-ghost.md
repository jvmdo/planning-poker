# 03: Walk the Ghost

**What to build:** An Observer walks their Ghost anywhere in the room area, and everyone sees it walk there.
- **Input:** click or tap empty room space, or press the arrow keys (a hop of a tenth of the Table) while the Ghost has focus.
- **Walking:** at a steady speed (one Table width in about 1.5 s) with a gentle start and stop. The owner's Ghost starts moving on the click, before the server answers.
- **Same Card on every screen:** a Ghost over Bruno's Card is over Bruno's Card on every screen, Bruno's included. Positions live on the shared Table, and each Voter's screen turns them the way it turns the seats.
- **Where it can go:** each screen keeps the Ghost inside its own room area. Ghosts stay out of the sidebar and status bar, and pass under the Hand and toasts.
- **Move limit:** held keys and rapid clicks are capped.
- **Bots:** the scenario script gains bot Observers whose Ghosts wander, for checking by hand.

Only the destination crosses the network; each screen animates the walk itself. See the spec in this folder (user stories 24–25, 28–39) and the walking demo in the art prototype.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] Room: `moveGhost(id, to)`, rejected with no Ghost, a point that isn't two finite numbers from −0.5 to 1.5, or the move limit spent. A rejected move leaves the Room unchanged.
- [ ] Move limit: a burst of 10 moves, then one more every 100 ms, on its own budget separate from Reactions and Throws (fake-timer tests in the style of the existing burst-limit tests).
- [ ] An accepted move sends no snapshot. It reaches a ghost subscriber once, as a one-off event, and the next snapshot carries the latest destination for late joiners.
- [ ] The adapter broadcasts `ghostMoved` within the Room. The client shows no toast for a rejected move.
- [ ] A pure Ghost frame module, built on ticket 01's seat layout, converts between the shared Table and a screen: map onto a unit circle, turn by the viewer's seat, map back, clamp to the room area. Screen to Table is the reverse.
- [ ] Ghost frame tests: a point over seat i lands over seat i on every Voter's screen for several Room sizes; converting there and back gives the same point; clamping keeps points inside the room area.
- [ ] Clicks on seats, Cards, controls and the Hand keep their current behaviour and never move the Ghost.
- [ ] The walk is animated frame by frame at a constant speed measured on the shared Table, easing in and out. A new destination mid-walk continues smoothly from where the Ghost is drawn.
- [ ] Checked by hand: with three Voters and one bot Observer, the Ghost parked on one Voter's Card sits on that Card in every Voter's browser.
