# 02: Build-up and bursts

**What to build:** the Nudge grows with the team's impatience, and bursts merge into one.
- **Scaling:** the Holdout's shake scales with the event's `level`, from a small ~0.5 s jitter at level 1 to a violent ~1.5 s shake at level 5.
- **Merging:** a Nudge that arrives while one is still playing in this browser raises it to the new level and restarts its timer instead of queueing.
- **Toasts:** they update in place for the burst. The Holdout sees "Ana, Caio and 3 others sent you a Nudge!" and everyone else "Ana, Caio and 3 others Nudged Bruno". That's one notice and one screen-reader alert per burst.

See the spec in this folder: user stories 18–21 and 24–25, and the client's **One Nudge on screen at a time**, **Holdout's screen** and **Toasts** bullets.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A small pure client module merges a burst (the names in order and the highest level) and words the toast for each viewer. Unit tests cover one name, two names, "and N others", and the three viewers (Holdout, sender, everyone else).
- [ ] Shake amplitude and length scale with the level, with level 5 clearly stronger than 1 and the screen still usable.
- [ ] A burst plays one shake at the latest level, never a queue.
- [ ] The toast updates in place for a burst rather than stacking new notices.
- [ ] Checked in a browser with 5+ Participants Nudging the same Holdout in quick succession, and once with one person Nudging repeatedly (strength stays at 1).
