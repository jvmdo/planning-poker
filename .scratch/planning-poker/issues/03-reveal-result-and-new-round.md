# 03: Reveal, Result and New Round

**What to build:** The Facilitator has a Reveal button. Pressing it turns every Vote face-up for everyone at once: each Participant's Card appears next to their name, along with the Result (the mean of the Votes cast, to one decimal place). Reveal is disabled until at least one Vote exists, and it works even if not everyone has voted. After the Reveal, Votes are locked. The Facilitator also has a New Round button, usable before or after the Reveal, that clears every Vote and resets the board for everyone. Other Participants don't see these controls.

**Blocked by:** 02 (Vote in secret)

**Status:** ready-for-agent

- [ ] Only the Facilitator sees enabled Reveal and New Round controls. The Room rejects both commands from anyone else.
- [ ] Reveal is disabled in the UI, and rejected by the Room, while zero Votes have been cast. It's allowed when only some Voters have voted.
- [ ] After the Reveal, every Participant's snapshot contains every Vote value and the Result.
- [ ] The Result is the arithmetic mean of the Votes cast, rounded to one decimal place. Voters who didn't vote are not counted.
- [ ] After the Reveal, the Room rejects any Vote until a New Round starts.
- [ ] New Round works before and after the Reveal. It clears all Votes and the Reveal for everyone. Before the Reveal, the discarded Votes are never shown.
- [ ] Tests cover the Facilitator-only rules, the zero-Vote rejection, partial Reveals, the Result calculation (including a non-integer mean), Votes locked after the Reveal, and New Round both before and after the Reveal.
