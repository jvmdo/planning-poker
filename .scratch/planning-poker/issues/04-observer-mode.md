# 04: Observer mode

**What to build:** Any Participant can switch themselves between Voter and Observer at any time. Observers see the same board as everyone else but have no Card hand. They're never shown as someone the Room is waiting on, and they can't vote. A Voter who has already voted and switches to Observer before the Reveal has their Vote discarded.

**Blocked by:** 02 (Vote in secret)

**Status:** ready-for-agent

- [ ] Each Participant has a Voter/Observer toggle that takes effect for everyone immediately. The Participant list shows each Participant's role.
- [ ] Observers have no Card hand, and the Room rejects a Vote from an Observer.
- [ ] Observers are not shown with a pending "hasn't voted" state.
- [ ] Switching to Observer discards that Participant's Vote for the current Round.
- [ ] Switching back to Voter lets them vote in the current Round if it hasn't been revealed.
- [ ] Facilitator status is unaffected by switching between Voter and Observer.
- [ ] Tests cover switching both ways, the discarded Vote, rejecting an Observer's Vote, and the Facilitator keeping the role while an Observer.
