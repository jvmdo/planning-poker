# 01: Updates stay in their Room

**What to build:** Make the server ready for more than one Room without changing anything anyone can see. A new Rooms registry owns the Rooms by Room ID, and the socket adapter sends a Room's snapshots, Reactions, Throws, Deck changes and `left` only to that Room's sockets, using Socket.IO rooms, instead of to every socket on the server. Every connection still goes to one fixed Room, so the app behaves exactly as today. This closes the leak where a second Room would see the first one's Votes, before a second Room can exist. Also start the `rooms` branch and its draft PR, so Render builds the preview.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] A `rooms` branch exists with a draft PR to `main`, and Render builds a pull request preview for it.
- [ ] A Rooms registry module on the server (no sockets) creates a Room on its first join and returns the same Room after that. It is created when a Participant joins, not when a socket connects.
- [ ] The adapter keeps the socket's Room ID on the socket, puts the socket in the Socket.IO room named after it on `join`, and sends every snapshot, `fun`, `deckChanged` and `left` only within that Room. Nothing loops over every socket on the server any more.
- [ ] `leave` from one tab affects only the tabs of that Participant in the same Room.
- [ ] For now, every connection uses one fixed Room ID; the client is unchanged.
- [ ] Registry tests: the same Room ID gives the same Room; two Room IDs give independent Rooms (a Vote in one never shows in the other's snapshots).
- [ ] All existing Room tests pass unchanged.
- [ ] Checked in a browser on an isolated server: joining, voting, Reveal, Reactions, Deck change, Leave and a reload work as before.
- [ ] The planning-poker spec's Socket adapter section says updates go to the Room's sockets, not every socket.
