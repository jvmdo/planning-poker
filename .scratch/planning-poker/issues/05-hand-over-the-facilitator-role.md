# 05: Hand over the Facilitator role

**What to build:** The Facilitator can hand the role to any other Participant present, Observers included. Everyone sees the badge move immediately. The new Facilitator gets the Reveal, New Round and hand-over controls, and the previous Facilitator loses them.

**Blocked by:** 03 (Reveal, Result and New Round)

**Status:** ready-for-agent

- [x] The Facilitator can pick another present Participant and hand them the role.
- [x] After the hand-over, exactly one Participant is Facilitator, everyone's snapshot reflects it, and the controls follow the role.
- [x] The Room rejects a hand-over from a non-Facilitator, or to someone who isn't present.
- [x] Handing over to an Observer works, and that Observer can Reveal and start New Rounds without voting.
- [x] The current Round, Votes and Reveal state are unaffected by a hand-over.
- [x] Tests cover a successful hand-over (including to an Observer), both rejections, and the new Facilitator's controls working while the old one's are rejected.

## Comments

**Implemented (2026-10-28).** All criteria are met. Notes for later tickets:

- **Extra rule:** the Facilitator handing the role to themselves is rejected (`already-facilitator`). This leaves the Room unchanged and notifies nobody. The ticket says "another" Participant.
- **UI:** each other Participant's row has a crown button, shown only to the Facilitator. A `window.confirm` guards it so a stray tap can't give the role away.
- **06:** "present" currently means "in the Room". 06 should decide whether a Participant who is away in their grace period can receive the role. Under the spec's Names rule, they still count as present. Also, the client ignores hand-over rejections. Once 06 removes Participants, a hand-over to someone who just expired would fail with no message, so show it then.
