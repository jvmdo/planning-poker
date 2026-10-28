# 07: Recover from a lost Facilitator

**What to build:** If the Facilitator's 30-second grace period expires, the current Round is discarded (all Votes cleared, nothing revealed) and the Room has no Facilitator. Everyone then sees a "Become Facilitator" button. The first Participant to click it becomes Facilitator, and the button disappears for everyone else.

**Blocked by:** 03 (Reveal, Result and New Round), 06 (Survive disconnects (grace period))

**Status:** ready-for-agent

- [x] When the Facilitator's grace period expires, they're removed, the current Round is discarded, and every snapshot shows no Facilitator.
- [x] While there's no Facilitator, every Participant sees a "Become Facilitator" button, and nobody can Reveal or start a New Round.
- [x] The first claim wins. Any later claim, and any claim while a Facilitator exists, is rejected and leaves the Room unchanged.
- [x] A Facilitator who reconnects within the grace period keeps the role and the current Round (no recovery happens).
- [x] Tests use fake timers to cover: Facilitator expiry discarding the Round; two claims in a row resulting in exactly one Facilitator; rejecting a claim while a Facilitator exists; a Facilitator reconnecting at 29 seconds keeping everything.

## Comments

**Implemented (2026-10-28).** All criteria are met. Notes:

- **Expiry:** when the Facilitator's grace period expires, the Round is discarded (the same `discardRound()` New Round uses) and the Room has no Facilitator. The snapshot's `hasFacilitator` drives the "Become Facilitator" card, which everyone sees, Observers included.
- **Coming back late:** a Facilitator who returns after expiry rejoins as an ordinary Participant and has to claim like everyone else. If the Room emptied completely, the first Participant back becomes Facilitator (story 43).
- **Extra rule:** a claim from someone who isn't in the Room is rejected (`not-in-room`).
- **Client:** the losing claimer sees "Someone else became the Facilitator first." Claims are processed one at a time on the single Node process, so two simultaneous claims always leave exactly one Facilitator. A browser run confirmed this with two clicks fired at once.
