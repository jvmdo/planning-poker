# 23: Keep a Vote through a long absence

**What to build:** A Voter whose connection drops for longer than the grace period gets their Vote back when they rejoin in the same Round. Today the Room removes them when the 30 seconds run out and discards their Vote with them, so they come back as a new Participant with no Vote: an empty slot before the Reveal, a "–" after it. This happens to anyone on a phone who switches apps or locks the screen for a while, since mobile browsers stop the connection of a page in the background.

**Blocked by:** none

**Status:** ready-for-agent

## Acceptance criteria

- [x] When a Voter's grace period runs out, their Vote is set aside for the rest of the Round instead of discarded.
- [x] If they rejoin (the same browser identity) in the same Round, the Vote is theirs again: before the Reveal they show as played and see their Card in their hand; after it, their Vote is face-up and counts in the Result.
- [x] A set-aside Vote doesn't count while they're gone: it isn't in the Result, the Reveal doesn't count it, and they aren't listed.
- [x] A New Round, a new Deck or a lost Facilitator discards set-aside Votes with the rest of the Round.
- [x] Leave still removes the Vote for good: leaving is deliberate.
- [x] Unchanged: rejoining within the grace period keeps everything, as today.

## Out of scope

- A longer grace period: phones can stay in the background for minutes, so it would only make this rarer.
- Keeping the Voter listed while they're gone.

## Comments

**Reported (2026-11-19).** A teammate on a phone voted, put the browser in the background, and came back to a "–" on their Card. The frozen reading of issue 22 (on the `outliers` branch) doesn't help, since the Vote is gone on the server; it even marks the returning Outlier's "–" Card, because the mark is looked up by their ID. Restoring the Vote fixes both.

**Implemented (2026-11-19).** All criteria are met. When the grace timer removes a Voter, `remove(id, { keepVote: true })` moves their Vote into the Room's `setAside` map instead of discarding it; `join` gives it back when that ID joins again as a new Participant; `discardRound` clears it, so a New Round, a new Deck or a lost Facilitator ends it. Leave and the Facilitator-loss path still discard. Tested in `room.test.ts` ("a Voter who comes back after their grace period ran out"): back before and after the Reveal, counted in the Result only once back, and not back after a New Round, a new Deck, a lost Facilitator or Leave, nor given to anyone else. If everyone is gone, the empty Room is dropped after 60 seconds as before, set-aside Votes with it.

**Reading again when a Vote comes back (2026-11-19).** The user asked for this branch to be based on `outliers`, and for the frozen reading of issue 22 to take in a Vote that comes back after the Reveal. `keepReading` now keeps the Votes it read (with names); when a revealed Vote appears that it hasn't read, it adds it to them and reads again, still keeping the Votes of anyone who left. Checked in the browser on a separate server: Davi voted 64h and closed his page; after 30 seconds the Facilitator revealed "Everyone agrees", 8.0h; Davi reopened the page and everyone saw "Ask Davi why", 22.0h, his Card marked, and Davi saw "You're an Outlier, tell the team why 🙋".
