# 07: Recover from a lost Facilitator

**What to build:** If the Facilitator's 30-second grace period expires, the current Round is discarded (all Votes cleared, nothing revealed) and the Room has no Facilitator. Everyone then sees a "Become Facilitator" button. The first Participant to click it becomes Facilitator, and the button disappears for everyone else.

**Blocked by:** 03 (Reveal, Result and New Round), 06 (Survive disconnects (grace period))

**Status:** ready-for-agent

- [ ] When the Facilitator's grace period expires, they're removed, the current Round is discarded, and every snapshot shows no Facilitator.
- [ ] While there's no Facilitator, every Participant sees a "Become Facilitator" button, and nobody can Reveal or start a New Round.
- [ ] The first claim wins. Any later claim, and any claim while a Facilitator exists, is rejected and leaves the Room unchanged.
- [ ] A Facilitator who reconnects within the grace period keeps the role and the current Round (no recovery happens).
- [ ] Tests use fake timers to cover: Facilitator expiry discarding the Round; two claims in a row resulting in exactly one Facilitator; rejecting a claim while a Facilitator exists; a Facilitator reconnecting at 29 seconds keeping everything.
