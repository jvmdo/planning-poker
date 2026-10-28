# 04: Observer mode

**What to build:** Any Participant can switch themselves between Voter and Observer at any time. Observers see the same board as everyone else but have no Card hand. They're never shown as someone the Room is waiting on, and they can't vote. A Voter who has already voted and switches to Observer before the Reveal has their Vote discarded.

**Blocked by:** 02 (Vote in secret)

**Status:** ready-for-agent

- [x] Each Participant has a Voter/Observer toggle that takes effect for everyone immediately. The Participant list shows each Participant's role.
- [x] Observers have no Card hand, and the Room rejects a Vote from an Observer.
- [x] Observers are not shown with a pending "hasn't voted" state.
- [x] Switching to Observer discards that Participant's Vote for the current Round.
- [x] Switching back to Voter lets them vote in the current Round if it hasn't been revealed.
- [x] Facilitator status is unaffected by switching between Voter and Observer.
- [x] Tests cover switching both ways, the discarded Vote, rejecting an Observer's Vote, and the Facilitator keeping the role while an Observer.

## Comments

**Implemented (2026-10-28).** All criteria are met. Notes for later tickets:

- **Rule interpretation:** becoming an Observer discards the Vote only **before** the Reveal. After the Reveal the Vote is locked (story 15, Round rules), so the revealed Card and Result stay put. That Participant then shows as Observer, Voted, plus their Card. The spec's Role rule ("Becoming an Observer discards your current Vote") omits that qualifier. Ticket 04's summary and story 33 include it.
- **Carried over from 01:** `join` from an ID that's already present now keeps that Participant's role. A reload no longer turns an Observer back into a Voter. Ticket 06's "restores … Voter/Observer role" builds on this.
- **Extra rule:** a role switch from someone who isn't in the Room is rejected (`not-in-room`). A switch to the role you already have succeeds without notifying anyone.
