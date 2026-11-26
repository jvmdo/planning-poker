# 04: The buzz

**What to build:** a short original buzz plays on the Holdout's device when they're Nudged. It's the app's first sound.
- **Making it:** it's synthesised with the Web Audio API (for example a low, rough oscillator pulsed a few times), with no audio file and nothing copied from MSN.
- **When:** only the Holdout hears it, once per burst, louder at higher levels.
- **Failure:** if the browser won't play audio (no interaction yet, or it's blocked), the Nudge goes ahead silently with no error.

See the spec in this folder: user stories 10 and 21, and the client's **Buzz** bullet.

**Blocked by:** 02

**Status:** closed

- [x] The buzz is synthesised in a small client module, with one `AudioContext` created lazily and reused.
- [x] Only the Holdout's browser plays it, once per burst, with volume growing with the level.
- [x] A refused or suspended audio context fails silently.
- [x] Checked by ear at levels 1 and 5 (a human check).

## Comments

- The buzz is in `src/client/lib/buzz.ts`: two slightly detuned low notes (110 and 116 Hz, sawtooth and square) under a 900 Hz low-pass, pulsed 3 times in about half a second. Volume goes from 0.08 at level 1 to 0.25 at level 5.
- Once per burst: it waits 200 ms after the burst's first Nudge, so Nudges sent at the same moment are heard as one buzz at the burst's level. In a browser, 5 Nudges at once gave one buzz on the Holdout's page, at level 5's volume, and none on the sender's page.
- Browsers only allow sound after a click or key press on the page, so the first one creates the AudioContext (or wakes it). If the context is still asleep when a buzz is due, it's woken; if that takes more than 300 ms or fails, the buzz is dropped silently. Headless Chromium doesn't enforce this rule, so that path was checked by reading the code, not run.
- **For a human:** listen at levels 1 and 5, and on a phone.
- Signed off by the human after listening locally.
