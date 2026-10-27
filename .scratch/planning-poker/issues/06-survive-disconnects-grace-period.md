# 06: Survive disconnects (grace period)

**What to build:** When a Participant's connection drops, from a page reload, a Wi-Fi blip or a closed laptop lid, they have 30 seconds to come back. Meanwhile, others see them as "away". If they return in time, they keep their place, their role and their current Vote. If not, they are removed from the Room and their Vote is discarded. The client shows a clear connecting/reconnecting state, including while the server wakes up. After a server restart, browsers reconnect and rejoin silently with their stored name and ID.

**Blocked by:** 02 (Vote in secret)

**Status:** ready-for-agent

- [ ] When a Participant's socket closes, the Room starts a 30-second grace period, and everyone sees that Participant marked "away".
- [ ] Reconnecting within the grace period cancels it and restores the Participant exactly as before: name, Voter/Observer role and current Vote.
- [ ] When the grace period expires, the Participant is removed and their Vote discarded, and everyone's snapshot updates even though no command came in.
- [ ] A name stays reserved during its owner's grace period. Someone else can't take it, but the owner can rejoin with it.
- [ ] The client shows a visible connecting/reconnecting state whenever the socket isn't connected, and rejoins automatically once it is.
- [ ] After a server restart (empty Room), clients rejoin automatically with no user action, and the first to rejoin becomes Facilitator.
- [ ] Tests use Vitest fake timers to cover: reconnect at 29 seconds keeps everything; expiry at 30 seconds removes the Participant and their Vote; the change notification fires on expiry; the name is reserved during the grace period.
- [ ] This ticket covers ordinary Participants. A Facilitator who disconnects briefly also keeps the role (same rule), and what happens when a Facilitator's grace period expires is ticket 07.
