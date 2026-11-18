# Spec: Rooms

Status: ready-for-agent

## Problem Statement

The app has exactly one Room, at the root URL. Two teams, or two sub-teams of one team, can't estimate at the same time: they'd share one Deck, one Facilitator and one Round. And since the app is public, anyone who opens it lands in the same Room as everyone else.

## Solution

Every URL such as `/team-alpha` is its own Room, created when its first Participant joins. Opening `/` takes a browser back to the last Room it joined, or offers to create a new Room with a random, hard-to-guess Room ID. A Participant invites others by copying the Room's Share link from the status bar. A Room is removed one minute after its last Participant is gone, so a team that drops off together comes back to the same Deck.

Everything else about a Room (Voting, the Reveal, roles, grace periods, Reactions and Throws, the Deck) is unchanged, and is in `.scratch/planning-poker/spec.md`. The vocabulary is in `GLOSSARY.md`; the decisions are in ADR 0001 and ADR 0002.

## User Stories

1. As a team member, I want to open `/team-alpha` and land in that Room, so that my team can bookmark its own Room.
2. As a team member opening `/` for the first time, I want to type my name and get a new Room, so that there's nothing to set up before a meeting.
3. As a team member, I want a new Room's ID to be hard to guess, so that strangers don't wander into my Room.
4. As a team member, I want to copy my Room's Share link from the status bar, so that I can paste it into the meeting chat.
5. As a team member opening `/` again, I want to go straight back to the last Room I joined, so that a bookmark of the site is enough.
6. As a team member opening a link to a Room I haven't joined, I want the join screen with my name filled in, so that I join a new Room on purpose, with one click.
7. As a team member, I want the join screen to say which Room I'm joining, so that I know I followed the right link.
8. As a team member, I want my name checked only against the Participants of my Room, so that a name used in another Room doesn't stop me.
9. As a team member, I want to be in two Rooms at once in two tabs, so that I can follow a second team's session.
10. As a team member who Leaves a Room, I want `/` to stop taking me back to it, so that leaving is final.
11. As a Participant, I want the Room ID in the status bar and the tab title, so that two open tabs are easy to tell apart.
12. As a team that drops off together (the meeting ends, everyone's Wi-Fi blips), I want the Room to keep its Deck if we come back within a minute.
13. As a team member who mistypes a Room's URL with characters a Room ID can't have, I want to be told it isn't a valid Room, with a way to start a new one.
14. As a team member, I want to be told when the server or my Room is full, so that I know why I can't join.

## Implementation Decisions

### Room IDs

- 1 to 40 characters from `a–z`, `0–9` and `-`. Uppercase is converted to lowercase, so `/Team-Alpha` is the Room `team-alpha`. Anything else isn't a Room ID.
- The rule, and the function that converts and checks a Room ID, live in the shared area: the client uses it to read the URL, the server to check what the client sends.
- A random Room ID is `word-word-number` (e.g. `brave-otter-42`), made up by the client from two word lists and a number, hundreds of thousands of combinations. Room IDs typed by hand are still allowed.
- Room IDs never contain a dot, which keeps them apart from static files (`/logo.svg`, `/assets/…`).

### Rooms registry (server, pure module), a second test seam

- Owns every Room by its Room ID. Has no knowledge of sockets.
- A Room is created when someone joins it, never when its page is opened or a socket connects.
- Refuses to create a Room past **100 Rooms** (`server-full`). Rooms that already exist keep working.
- Removes a Room **1 minute** after it becomes empty. A Room is empty when it has no Participants, counting those in their grace period, so after a dropped connection a Room goes about 30 s + 60 s later. A join during that minute cancels the removal, and the Room is exactly as it was left: its Deck, its Round number, no Votes, and the first one back becomes Facilitator.
- After its removal, a Room ID names a new Room, with the default Deck.
- The Room gets one new query, `isEmpty()`, and one new rule: `join` is refused past **30 Participants** (`room-full`), except for a Participant already in the Room rejoining.

### Protocol and socket adapter

- The client sends the Room ID once, in the Socket.IO handshake (`io({ query: { room } })`). The adapter checks it and drops a connection with an invalid one. No command carries a Room ID; every command acts on the socket's Room.
- On `join`, the adapter gets or creates the Room from the registry and puts the socket in the Socket.IO room named after the Room ID.
- Snapshots, Reactions, Throws, Deck changes and `left` go only to that Room's sockets. A Room's updates must never reach another Room's sockets.
- One browser keeps one Participant ID for every Room. Leaving affects only the tabs in that Room.
- New join rejections: `server-full` and `room-full`.

### HTTP entry

- Any path without a dot that isn't a static file gets `index.html`, so `/team-alpha` loads the app.

### Client

- The Room ID comes from the URL's path. An invalid one shows a "Not a valid Room" page with a link to `/`.
- Browser storage keeps the Participant ID, the name, and the **last Room** joined (one Room, replacing `inRoom`). Old stored data with `inRoom` but no Room counts as no Room.
- At `/`:
  - with a last Room: go to it (replacing the history entry) and rejoin automatically;
  - without one: the join screen, with no Room named and a **Create Room** button. Creating makes up a random Room ID, goes to it and joins.
- At `/<id>`: a URL that names a Room always wins over the last Room.
  - if it is the last Room: rejoin automatically, as today;
  - otherwise: the join screen says "Joining **team-b**", with the stored name filled in. Joining makes it the last Room.
- Leave clears the last Room (only if it is this tab's Room) and shows the join screen for the same Room.
- The status bar shows the Room ID and a copy button: `team-alpha [copy] · Voting`. The ID is cut short with "…" after about 16 characters, and the full ID shows on hover. Copy puts the Share link on the clipboard and shows "Link copied" in the toast. Phones and the share sheet are out of scope.
- The tab title is `team-alpha · Planning Poker`, with the ID cut short after 24 characters.
- New join screen messages: "The server is full, try again later." and "This Room is full."

### Delivery

- The work lands on a `rooms` branch with one long-lived draft PR. Render builds a pull request preview automatically and redeploys it on every push; the live app keeps deploying from `main`. Merging the PR ships Rooms and removes the preview.

## Testing Decisions

- **The Room module** keeps its tests and their style. New: `isEmpty()`, and `room-full` (including a rejoin by a Participant already in a full Room).
- **The Rooms registry** is tested only through its interface, with Vitest fake timers: a Room is created on the first join and returned to later ones; two Room IDs give two independent Rooms (a Vote in one never shows in the other's snapshots); the 101st Room is refused but existing Rooms still accept joins; an empty Room is still there at 59 s and gone at 60 s; a join at 59 s keeps it, with its Deck; a Participant's grace period delays the removal.
- **Room ID parsing** is tested directly, like `parseDeck`: conversion to lowercase, the length and character limits, dots, and that random Room IDs are valid.
- Still no adapter or UI tests. The adapter change that matters most (updates stay in their Room) is checked by hand in a browser with two Rooms open, on an isolated server.

## Out of Scope

- A list of Rooms, or any way to find a Room without its Room ID.
- Room passcodes, accounts or invitations beyond the Share link.
- Renaming a Room, or moving Participants between Rooms.
- Remembering more than the last Room joined.
- Keeping Rooms across a restart or redeploy (ADR 0001).
- The share sheet and mobile-specific sharing.
- A Participant cap other than 30, or caps that change with load.
