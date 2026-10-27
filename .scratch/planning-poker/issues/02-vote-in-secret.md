# 02: Vote in secret

**What to build:** Voters see the Deck (`1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64`, each an Estimate in hours) as a hand of Cards and play one with a click or tap. Their chosen Card is highlighted, and they can change it as often as they like. Everyone sees *which* Participants have voted, never *what* they voted. Not even the network payload sent to other browsers contains another person's Vote. Someone who joins mid-Round can still vote.

**Blocked by:** 01 (Walking skeleton: join the Room and see who's here)

**Status:** ready-for-agent

- [ ] The Deck is defined once in the shared area and rendered as a hand of Cards that wraps into a tappable grid on narrow screens.
- [ ] Playing a Card records the Voter's Vote. Playing another replaces it. The player's own Card is highlighted.
- [ ] Every Participant sees a "has voted" marker for each Participant who has voted in this Round.
- [ ] The Room rejects a value that isn't a Card in the Deck, leaving the Room unchanged.
- [ ] Before the Reveal, a Participant's snapshot contains their own Vote and no other Vote values. A test serializes another Participant's snapshot and checks that no Vote value appears anywhere in it.
- [ ] A Participant who joins mid-Round can vote in the current Round.
- [ ] Tests cover voting, changing a Vote, voted markers, and rejecting an invalid Card, all through Room commands and snapshots.
