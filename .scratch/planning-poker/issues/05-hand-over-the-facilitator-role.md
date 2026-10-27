# 05: Hand over the Facilitator role

**What to build:** The Facilitator can hand the role to any other Participant present, Observers included. Everyone sees the badge move immediately. The new Facilitator gets the Reveal, New Round and hand-over controls, and the previous Facilitator loses them.

**Blocked by:** 03 (Reveal, Result and New Round)

**Status:** ready-for-agent

- [ ] The Facilitator can pick another present Participant and hand them the role.
- [ ] After the hand-over, exactly one Participant is Facilitator, everyone's snapshot reflects it, and the controls follow the role.
- [ ] The Room rejects a hand-over from a non-Facilitator, or to someone who isn't present.
- [ ] Handing over to an Observer works, and that Observer can Reveal and start New Rounds without voting.
- [ ] The current Round, Votes and Reveal state are unaffected by a hand-over.
- [ ] Tests cover a successful hand-over (including to an Observer), both rejections, and the new Facilitator's controls working while the old one's are rejected.
