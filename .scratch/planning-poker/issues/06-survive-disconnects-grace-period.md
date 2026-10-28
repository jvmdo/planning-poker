# 06: Survive disconnects (grace period)

**What to build:** When a Participant's connection drops, from a page reload, a Wi-Fi blip or a closed laptop lid, they have 30 seconds to come back. Meanwhile, others see them as "away". If they return in time, they keep their place, their role and their current Vote. If not, they are removed from the Room and their Vote is discarded. The client shows a clear connecting/reconnecting state, including while the server wakes up. After a server restart, browsers reconnect and rejoin silently with their stored name and ID.

**Blocked by:** 02 (Vote in secret)

**Status:** ready-for-agent

- [x] When a Participant's socket closes, the Room starts a 30-second grace period, and everyone sees that Participant marked "away".
- [x] Reconnecting within the grace period cancels it and restores the Participant exactly as before: name, Voter/Observer role and current Vote.
- [x] When the grace period expires, the Participant is removed and their Vote discarded, and everyone's snapshot updates even though no command came in.
- [x] A name stays reserved during its owner's grace period. Someone else can't take it, but the owner can rejoin with it.
- [x] The client shows a visible connecting/reconnecting state whenever the socket isn't connected, and rejoins automatically once it is.
- [x] After a server restart (empty Room), clients rejoin automatically with no user action, and the first to rejoin becomes Facilitator.
- [x] Tests use Vitest fake timers to cover: reconnect at 29 seconds keeps everything; expiry at 30 seconds removes the Participant and their Vote; the change notification fires on expiry; the name is reserved during the grace period.
- [x] This ticket covers ordinary Participants. A Facilitator who disconnects briefly also keeps the role (same rule), and what happens when a Facilitator's grace period expires is ticket 07.

## Comments

**Implemented (2026-10-28).** All criteria are met. Decisions and notes:

- **No separate `reconnect(id)` command (departs from the spec's command list):** `join(id, name)` from an ID already present *is* the reconnect. It cancels the grace timer and keeps role and Vote. The client already sends `join` on every connect, so the adapter never has to choose between `join` and `reconnect`. One side effect: a rejoin takes the name it's sent, but the client always sends the stored name.
- **Connections are counted per Participant.** Two tabs in one browser share a Participant ID, so the grace period starts only when the last connection closes. The adapter counts each socket once: it ignores a repeated `join` from the same socket, and it releases the old ID if a socket joins under a different one.
- **Facilitator expiry (07):** the expired Facilitator is removed and the Room is left with **no Facilitator**. Otherwise that browser would silently regain the role when it came back. Discarding the Round, the "Become Facilitator" button and claims are 07's work.
- **Hand-over (from 05):** an away Participant can receive the role, because they count as present under the spec's Names rule.
- **Result after the Reveal (from 03), still open:** an expiry after the Reveal removes that Vote, so the revealed Result changes to cover only the Participants still present. If the Result should stay fixed once revealed, store it in `reveal`.
- **Client:**
  - an "Away" marker and a dimmed row;
  - a connecting/reconnecting banner that mentions the server waking up;
  - brief notices for refused commands caused by races: a hand-over to someone who just left, a Vote landing after the Reveal, or a Reveal with no Votes left.
