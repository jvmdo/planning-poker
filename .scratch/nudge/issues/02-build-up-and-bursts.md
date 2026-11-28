# 02: Build-up and bursts

**What to build:** the Nudge grows with the team's impatience, and bursts merge into one.
- **Scaling:** the Holdout's shake scales with the event's `level`, from a small ~0.5 s jitter at level 1 to a violent ~1.5 s shake at level 5.
- **Merging:** a Nudge that arrives while one is still playing in this browser raises it to the new level and restarts its timer instead of queueing.
- **Toasts:** they update in place for the burst. The Holdout sees "Ana, Caio and 3 others sent you a Nudge!" and everyone else "Ana, Caio and 3 others Nudged Bruno". That's one notice and one screen-reader alert per burst.

See the spec in this folder: user stories 18–21 and 24–25, and the client's **One Nudge on screen at a time**, **Holdout's screen** and **Toasts** bullets.

**Blocked by:** 01

**Status:** closed

- [x] A small pure client module merges a burst (the names in order and the highest level) and words the toast for each viewer. Unit tests cover one name, two names, "and N others", and the three viewers (Holdout, sender, everyone else).
- [x] Shake amplitude and length scale with the level, with level 5 clearly stronger than 1 and the screen still usable.
- [x] A burst plays one shake at the latest level, never a queue.
- [x] The toast updates in place for a burst rather than stacking new notices.
- [x] Checked in a browser with 5+ Participants Nudging the same Holdout in quick succession, and once with one person Nudging repeatedly (strength stays at 1).

## Comments

- `nudgeStrength(level)` in `src/client/lib/nudge-burst.ts` gives 0 at level 1 and 1 at the top level. The shake is built on it, and the cracks (03) and the buzz (04) should use it too, so they all grow together (story 21).
- A sender's toast for a burst names them first: "You and Ana Nudged Bruno", "You, Ana and 1 other Nudged Bruno". The spec only gave the single-sender wording.
- Screen readers hear a burst once, when it's over (at most 1.5 s after its last Nudge), with its final wording. While the burst plays the toast changes in place without being read out.
- A new Round during a burst starts a fresh burst, so the old Round's names and level don't carry over.
