# 04: The buzz

**What to build:** a short original buzz plays on the Holdout's device when they're Nudged. It's the app's first sound.
- **Making it:** it's synthesised with the Web Audio API (for example a low, rough oscillator pulsed a few times), with no audio file and nothing copied from MSN.
- **When:** only the Holdout hears it, once per burst, louder at higher levels.
- **Failure:** if the browser won't play audio (no interaction yet, or it's blocked), the Nudge goes ahead silently with no error.

See the spec in this folder: user stories 10 and 21, and the client's **Buzz** bullet.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The buzz is synthesised in a small client module, with one `AudioContext` created lazily and reused.
- [ ] Only the Holdout's browser plays it, once per burst, with volume growing with the level.
- [ ] A refused or suspended audio context fails silently.
- [ ] Checked by ear at levels 1 and 5 (a human check).
