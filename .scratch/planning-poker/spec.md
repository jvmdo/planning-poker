# Spec: Planning Poker

Status: ready-for-agent

## Problem Statement

The team (~15 people) estimates task durations in hours during a remote meeting. Without a dedicated tool, people say their numbers out loud or type them into chat, so early answers anchor everyone else, it's hard to tell who hasn't answered yet, and someone has to compute the mean by hand. The team wants a simple shared web page where everyone picks a Card in secret, all Votes are revealed at once, and the Result is computed for them.

## Solution

A real-time web app with a single **Room** at the root URL. Participants join by typing a display name, with no login. Every Round, each **Voter** plays a **Card** from the Room's **Deck** of hours, which the Facilitator can change. Everyone can see who has voted but not what, until the **Facilitator** triggers the **Reveal**. The Reveal shows each Participant's Card and the **Result**, the mean of the Votes cast. The Facilitator then starts a new Round. People who only want to watch join as **Observers**. If someone drops off briefly (a page refresh or a Wi-Fi blip), they come back where they were. If the Facilitator leaves for good, anyone can step up.

The vocabulary used below is defined in `GLOSSARY.md`.

## User Stories

### Joining and identity

1. As a team member, I want to open one fixed URL and land in the team's Room, so that there's nothing to create or share before a meeting.
2. As a team member, I want to join by typing only a display name, so that I don't need an account or a password.
3. As a team member, I want my display name and identity remembered in this browser, so that a reload puts me straight back into the Room as the same Participant.
4. As a team member, I want to be told when the name I typed is already used by someone in the Room, so that two identical names never appear on the board.
5. As a team member, I want to join as a Voter by default, so that the common case needs no extra clicks.
6. As a team member, I want to see everyone currently in the Room and their role, so that I know who is present.
7. As a team member opening the app after it has been idle, I want to see a loading or connecting state while the server wakes up, so that I don't think the app is broken.

### Voting

8. As a Voter, I want to see the Deck (by default `1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64`) as Cards, so that I can pick an Estimate in hours.
9. As a Voter, I want to play a Card with one click or tap, so that voting is fast.
10. As a Voter, I want my chosen Card clearly highlighted, so that I know my Vote was registered.
11. As a Voter, I want to change my Vote as many times as I like before the Reveal, so that I can reconsider while others are still thinking.
12. As a Voter, I want to see which Participants have voted without seeing their values, so that I know who we're waiting on without being anchored.
13. As a Voter, I want nobody, including someone poking at browser developer tools, to be able to see the other Votes before the Reveal, so that the estimate stays independent.
14. As a Participant who joins mid-Round, I want to be able to vote in the current Round, so that I'm not locked out because I was late.
15. As a Voter, I want my Vote locked after the Reveal, so that the revealed numbers can't shift during the discussion.

### Reveal and Result

16. As the Facilitator, I want a Reveal button, so that I decide when voting ends.
17. As the Facilitator, I want the Reveal button disabled until at least one Vote has been cast, so that I can't reveal an empty Round.
18. As the Facilitator, I want to be able to reveal even when not every Voter has voted, so that one absent-minded person doesn't block the team.
19. As a Participant, I want the Reveal to turn every Vote face-up at the same moment for everyone, so that nobody sees the Votes early.
20. As a Participant, I want to see each Participant's Card next to their name after the Reveal, so that we can discuss outliers ("why 2 when I said 32?").
21. As a Participant, I want to see the Result (the mean of the Votes cast, to one decimal place) after the Reveal, so that nobody has to compute it by hand.
22. As a Participant, I want Voters who didn't vote left out of the Result, so that a missing Vote doesn't drag the mean down.

### Rounds

23. As the Facilitator, I want a New Round button that clears every Vote and starts voting again, so that we can move on to the next task.
24. As the Facilitator, I want to start a new Round before the Reveal too, discarding the current Votes unseen, so that I can restart when we were estimating the wrong task.
25. As a Participant, I want the board to reset for everyone when a new Round starts, so that we're all looking at the same state.

### Roles

26. As the first Participant to join an empty Room, I want to become the Facilitator automatically, so that the Room is always runnable.
27. As a Participant, I want to see clearly who the Facilitator is, so that I know who will Reveal.
28. As the Facilitator, I want to vote like any other Voter by default, so that my estimate counts too.
29. As the Facilitator, I want to hand the Facilitator role to any other Participant, Observers included, so that the right person (for example the Scrum Master who joined second) can run the session.
30. As a Participant, I want to switch myself between Voter and Observer at any time, so that I can sit out when I shouldn't estimate.
31. As an Observer, I want the Room not to wait on me, and not to be counted as someone who hasn't voted, so that my presence doesn't slow anyone down.
32. As an Observer, I want to see the same board as Voters, including the Reveal and the Result, so that I can follow the discussion.
33. As a Voter who already voted and then switches to Observer before the Reveal, I want my Vote discarded, so that the Result only reflects people who are voting.
34. As an Observer who is handed the Facilitator role, I want to be able to Reveal and start new Rounds without voting, so that I can run a session I don't estimate in.
35. As a non-Facilitator, I want the Reveal, New Round and hand-over controls hidden or disabled for me, so that I can't trigger them by accident.

### Disconnects and recovery

36. As a Participant whose connection drops briefly (refresh or Wi-Fi blip), I want 30 seconds to come back and keep my place, role and current Vote, so that a reload doesn't cost me anything.
37. As a Participant, I want someone who has been gone for more than 30 seconds removed from the Room, and their Vote discarded, so that the board and Result only reflect people who are still here.
38. As the Facilitator whose connection drops briefly, I want to keep the role and the current Round if I'm back within 30 seconds, so that a refresh doesn't wipe the Round for everyone.
39. As a Participant, when the Facilitator has been gone for more than 30 seconds, I want the current Round discarded and a "Become Facilitator" button shown to everyone, so that the meeting can continue.
40. As a Participant, I want "Become Facilitator" to be first-click-wins, so that there's never more than one Facilitator.
41. As a Participant, I want to see that a disconnected Participant is temporarily away during their grace period, so that I know why they aren't voting.
42. As a Participant, after a server restart, I want my browser to reconnect and rejoin silently with my saved name, so that the meeting continues with minimal disruption.
43. As the first Participant to rejoin after a server restart, I want to become Facilitator automatically (with no Round state surviving), so that the Room is immediately usable.

### Layout and language

44. As a Participant on a phone, I want the Cards to wrap into a tappable grid and the board to fit a narrow screen, so that I can vote from my phone while on the call from my laptop.
45. As a Participant, I want the whole UI in English, so that it matches the team's working language.
46. As a Participant on a wide desktop screen, I want the Room to fill the screen with a table where every Voter's Card sits at their seat, so that the space isn't wasted and I can see at a glance who has played.
47. As a Participant on a small desktop screen (down to 1024×720), I want to collapse the sidebar to just the logo, each Voter's Card and the Voter/Observer switch as icons, so that the table still has room.
48. As a Participant, I want the table to stay where it is at the Reveal, with the Result in its centre and the breakdown where my hand was, so that nothing jumps around when the Cards flip.

### Reactions and Throws

49. As a Voter, I want to hover or click my own Card and send a Reaction that everyone sees float up from it, so that I can show how I feel about the Round without talking over someone.
50. As a Participant, I want to hover or click another Voter's Card and Throw something at it (a paper ball, a rock, a tomato, an egg, a fish, flowers) that everyone sees fly from me to them, so that nudging a slow Voter or teasing an outlier is fun.
51. As an Observer, I want to Throw too, from where the Observers are listed, since I have no seat at the table.
52. As a Participant, I want to fire off a quick volley of up to 3 Reactions or Throws, then one more every 300 ms, so that teasing feels lively but nobody can flood everyone's screen.
53. As a Participant, I want Reactions and Throws to work at any time, by mouse, touch or keyboard, and to change nothing about the Round, so that they're never in the way.

### Choosing the Deck

54. As the Facilitator, I want to pick a preset Deck (Hours, Fibonacci, Powers of two) or type my own Cards, so that the team estimates on the scale that suits its tasks.
55. As the Facilitator, I want to see the hand as Voters will see it before I apply a Deck, and be told how many Votes applying it will clear, so that I don't surprise the team.
56. As a Participant, I want a changed Deck to start a new Round for everyone, with a short notice saying the Facilitator changed it, so that no Vote is left on a Card that no longer exists.
57. As a Participant, I want the Deck the Facilitator set to still be there at the next meeting, so that the team doesn't set it up again every time.

## Implementation Decisions

### Shape (see ADR 0001)

- One Node process serves both the built React single-page app and a Socket.IO server, on the same origin and port.
- The Room exists only in that process's memory: no database, no Redis, no history. It runs as exactly one instance on Render's free tier. A restart or redeploy wipes the Room, which is accepted.
- TypeScript everywhere, in a single package (no workspaces) with three areas: client, server, shared.
- Tooling: npm, the current Node LTS, Vite for the client, ESLint and Prettier with their recommended configs, Vitest for tests.

### Modules

**Room (server, pure domain module), the one deep module and the one test seam.**

- It holds all the rules: membership, roles, Voting, Reveal, Result, Rounds, hand-over, grace periods, Facilitator recovery.
- It has no knowledge of sockets, HTTP or React.
- **Commands**, each keyed by a stable Participant ID that the client generates and keeps in browser storage:
  - `join(id, name)`
  - `disconnect(id)`
  - `reconnect(id)`
  - `becomeVoter(id)`
  - `becomeObserver(id)`
  - `vote(id, card)`
  - `reveal(by)`
  - `newRound(by)`
  - `handOver(by, to)`
  - `claimFacilitator(id)`
  - `react(id, reaction)`
  - `throwAt(by, to, item)`
  - `setDeck(by, cards)`
- A command that breaks a rule returns a rejection with a reason and leaves the Room unchanged. Rejected cases include:
  - the name is already taken
  - the caller isn't the Facilitator
  - an Observer tries to vote
  - a Vote after the Reveal
  - a Card not in the Room's Deck
  - a Deck the same as the Room's, in any order
  - a Deck with fewer than 2 or more than 15 Cards, or a Card that isn't a whole number from 1 to 99
  - a Reveal with zero Votes
  - a claim while a Facilitator exists
  - a hand-over to an unknown Participant
  - a Reaction from an Observer, or one not in the Reactions list
  - a Throw at yourself, at an Observer or at an unknown Participant, or one not in the Throws list
  - a Reaction or Throw when the Participant has none left (see the burst limit below)
- **Query:** `snapshotFor(id)` returns the exact view that Participant is allowed to see.
- **Change notification:** a subscribe callback fires after every state change, including ones triggered by timers, so the adapter knows to send fresh snapshots.
- **Grace periods:** 30 seconds, using ordinary timers inside the module, which tests control with fake timers.
  - On expiry, the Participant is removed and their Vote is discarded.
  - If the expired Participant was the Facilitator, the current Round is also discarded and the Room has no Facilitator until someone claims it.
  - `reconnect` within the grace period cancels the timer and restores the Participant exactly as they were.
- **Role rules:**
  - Joining an empty Room makes you Facilitator.
  - A server restart empties the Room, so the first Participant to rejoin becomes Facilitator.
  - Facilitator and Voter/Observer are independent attributes.
  - Becoming an Observer discards your current Vote.
- **Round rules:**
  - Votes can change freely until the Reveal and are locked after it.
  - `newRound` is allowed at any time and clears all Votes and the Reveal.
  - `setDeck` is the Facilitator's, at any time. A Deck different from the current one discards the Round, like `newRound`; the same Deck is refused, so every Deck sent gets an answer. Duplicates are dropped and the Cards sorted ascending.
  - A new Room starts with the default Deck. The Deck stays when the last Participant leaves; only a restart, which makes a new Room, brings back the default.
- **Result:** the arithmetic mean of the Votes cast by Participants still present, rounded to one decimal place. It is computed only at the Reveal and shown only after it.
- **Reactions and Throws:** they leave the Room's state as it was and send no snapshots. An accepted one is passed to a separate subscriber as a one-off event (who, to whom, what), for the adapter to send on. The **burst limit** is per Participant and shared between Reactions and Throws: each Participant can send up to 3 in a row; after that, one more becomes available every 300 ms, and never more than 3 are saved up.
- **Deck changes:** besides the snapshots, an accepted new Deck is passed to a separate subscriber with who changed it, for the adapter to send on, so everyone else can be told.
- **Names:** compared after trimming and ignoring case. A name already used by a present Participant, including one in their grace period, is rejected, unless it's the same Participant ID rejoining.

**Shared contract (shared area).**

- The default Deck, `1, 2, 4, 6, 8, 10, 12, 16, 24, 32, 64`, the Deck limits (2 to 15 Cards, each a whole number from 1 to 99) and the function that parses and checks a Deck, used by both the Room and the Facilitator's dialog.
- The Room snapshot type.
- The Socket.IO typed event maps for client-to-server commands and server-to-client snapshots and rejections.
- Both sides import it, so they can't drift apart.

**Snapshot shape (per recipient)**:
- The Room's Participants, each with:
  - ID
  - display name
  - Voter or Observer
  - whether they're the Facilitator
  - whether they're connected or in their grace period
  - whether they've voted in this Round
- Whether a Facilitator currently exists (drives the "Become Facilitator" button).
- Whether the Round is revealed.
- The Room's Deck.
- Before the Reveal: the recipient's own Vote and no other Vote values anywhere in the payload.
- After the Reveal: every Vote value and the Result.

**Socket adapter (server).**

- Thin glue: on connection the client sends its stored ID and name.
- The adapter calls `join` or `reconnect`, translates each incoming event into a Room command, sends rejections back to the sender only, and calls `disconnect` when the socket closes.
- On every Room change notification it sends each connected socket its own `snapshotFor`.
- It never sends a snapshot as a broadcast that is the same for everyone, because hidden Votes depend on the recipient. Reactions, Throws and Deck changes are the exceptions: they hold no Votes, so the adapter broadcasts them to every socket as their own events.
- It contains no rules.

**HTTP entry (server).**

- Serves the built client's static files and the Socket.IO endpoint from the same process.
- Listens on the port the host provides.

**Client (React SPA).**

- Join screen: a display-name input, pre-filled from browser storage, showing name-taken errors.
- Room board:
  - Participants with their role, Facilitator badge, voted or away markers, and Cards after the Reveal.
  - The Result after the Reveal.
  - The Card hand.
  - The Voter/Observer toggle.
  - Facilitator controls: Reveal (disabled with zero Votes), New Round, hand-over, and the Deck dialog (presets, free input, a preview of the hand).
  - The "Become Facilitator" button when there's no Facilitator.
- Connecting/reconnecting state, covering Render's ~1-minute wake-up.
- The client keeps no Room state of its own beyond the latest snapshot. It renders that and sends commands.
- Socket.IO's automatic reconnect plus the stored ID give silent rejoin, including after a server restart.
- UI: shadcn/ui components with Tailwind, responsive from the start (the Card hand becomes a wrapping grid on narrow screens), English only.

## Testing Decisions

- **One seam: the Room module.** Tests drive it only through its commands and assert only on what `snapshotFor` returns, from each relevant Participant's point of view, and on rejections. They never reach into internal state, so the module's internals can be refactored freely.
- **One exception: `parseDeck`.** It reads the Cards the Facilitator types, which only the dialog does, so the Room can't reach it; it's tested directly. The Deck rules it shares with the Room are still tested through `setDeck`.
- A good test reads like a scenario from a meeting: "Ana and Bruno join; Ana votes 8; Bruno's snapshot shows Ana has voted but contains no value 8; Ana reveals; both snapshots show 8 and the Result 8.0".
- **Hidden Votes get dedicated tests.** Before the Reveal, a non-owner's snapshot contains no Vote values anywhere in its serialized form, not just in the obvious field. The Deck lists every Card for everyone, so it's left out of that search and checked instead to be exactly the Room's Deck.
- **Grace periods and Facilitator recovery** are tested with Vitest fake timers:
  - a reconnect at 29 seconds keeps everything
  - an expiry at 30 seconds removes the Participant and their Vote
  - a Facilitator expiry discards the Round and enables claiming
  - two claims result in exactly one Facilitator
- Every rejection listed under the Room module gets a test showing the Room is unchanged afterwards.
- **Reactions and Throws** are tested through their event subscriber: an accepted one reaches it once, a rejected one doesn't, and snapshots don't change. The burst limit is tested with fake timers: 3 Throws in a row are accepted and a 4th is rejected; another at 299 ms is still rejected, at 300 ms accepted; after a long pause, 3 are accepted again but not a 4th.
- **No tests for the socket adapter or the React UI for now.** They hold no rules by design. End-to-end browser tests can come later if the UI grows tricky.
- **Prior art:** none. The repo is empty, and these tests set the pattern.

## Out of Scope

- More than one Room, or sub-teams estimating in parallel.
- Accounts, login, SSO, or a Room passcode.
- Non-numeric or fractional Cards (`?`, ☕, ½), and a different Deck per Participant.
- Task titles, a backlog, or Jira/issue-tracker integration.
- Persistence of any kind: Round history, final estimates, exports.
- A Facilitator-recorded final estimate. The team agrees on the number out loud.
- Auto-Reveal when everyone has voted.
- Removing other Participants by hand. The grace period handles ghosts.
- Changing your display name without leaving and rejoining.
- Translations or a language switch.
- Horizontal scaling or more than one server instance.
- Socket adapter and UI tests, including end-to-end tests.

## Further Notes

- Render's free tier sleeps after ~15 minutes without traffic and takes ~1 minute to wake. Free services can't scale past one instance, which ADR 0001 relies on. Render may restart the service at any time.
- If Render's wake-up gets annoying, the same build runs unchanged on Fly.io (pinned to one machine) or on a laptop behind a tunnel (ngrok or Cloudflare Tunnel).
- Votes stay hidden because the server filters each snapshot per recipient. Never replace the per-recipient snapshot sends with one broadcast.
