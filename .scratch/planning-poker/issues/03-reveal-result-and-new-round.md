# 03: Reveal, Result and New Round

**What to build:** The Facilitator has a Reveal button. Pressing it turns every Vote face-up for everyone at once: each Participant's Card appears next to their name, along with the Result (the mean of the Votes cast, to one decimal place). Reveal is disabled until at least one Vote exists, and it works even if not everyone has voted. After the Reveal, Votes are locked. The Facilitator also has a New Round button, usable before or after the Reveal, that clears every Vote and resets the board for everyone. Other Participants don't see these controls.

**Blocked by:** 02 (Vote in secret)

**Status:** ready-for-agent

- [x] Only the Facilitator sees enabled Reveal and New Round controls. The Room rejects both commands from anyone else.
- [x] Reveal is disabled in the UI, and rejected by the Room, while zero Votes have been cast. It's allowed when only some Voters have voted.
- [x] After the Reveal, every Participant's snapshot contains every Vote value and the Result.
- [x] The Result is the arithmetic mean of the Votes cast, rounded to one decimal place. Voters who didn't vote are not counted.
- [x] After the Reveal, the Room rejects any Vote until a New Round starts.
- [x] New Round works before and after the Reveal. It clears all Votes and the Reveal for everyone. Before the Reveal, the discarded Votes are never shown.
- [x] Tests cover the Facilitator-only rules, the zero-Vote rejection, partial Reveals, the Result calculation (including a non-integer mean), Votes locked after the Reveal, and New Round both before and after the Reveal.

## Comments

**Implemented (2026-10-28).** All criteria are met. Notes for later tickets:

- **Extra rule:** a second Reveal of the same Round is rejected (`already-revealed`). This leaves the Room unchanged and notifies nobody.
- **06:** the Result is recomputed from the stored Votes in every snapshot. It isn't frozen at the Reveal. Once 06 removes an expired Participant's Vote, a revealed Result will change to reflect only the Participants still present. That matches the spec's "Votes cast by Participants still present". If the Result should instead stay fixed after the Reveal, store it in `reveal`.
- **04/06:** Votes are stored separately from Participants. Becoming an Observer (04) and removal after the grace period (06) must delete the Vote too.
- **Client:** Reveal is hidden, not disabled, after the Reveal. The rule that disables Reveal while there are zero Votes is copied onto the client (`round-panel.tsx`), as the spec asks.
- **Harmless:** `newRound` with no Votes and no Reveal still sends a change notification.
