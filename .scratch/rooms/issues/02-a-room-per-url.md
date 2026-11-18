# 02: A Room per URL

**What to build:** Every path such as `/team-alpha` is its own Room. The client reads the Room ID from the URL and sends it in the Socket.IO handshake; the server checks it and returns `index.html` for any path without a dot. Names are unique only within a Room. The join screen says which Room you're joining. An empty Room is removed one minute after its last Participant is gone. `/` stays the one fixed Room for now (ticket 03 changes that).

**Blocked by:** 01 (Updates stay in their Room)

**Status:** ready-for-agent

- [x] Room IDs (1–40 characters of `a–z`, `0–9`, `-`, uppercase converted to lowercase) are parsed and checked by one shared function, tested directly.
- [x] `/Team-Alpha` and `/team-alpha` are the same Room. The address bar shows the lowercase form.
- [x] A path that isn't a valid Room ID shows a "Not a valid Room" page with a link to `/`. The server drops a socket whose handshake has an invalid Room ID.
- [x] Any path without a dot that isn't a static file loads the app, in development (Vite) and in production.
- [x] The join screen at `/<id>` reads "Joining **<id>**". The rest of the screen is unchanged.
- [x] Two Rooms open side by side are independent: Participants, Facilitator, Votes, Deck, Reactions and Throws. The same name can be in both.
- [x] One browser can be in two Rooms in two tabs with the same Participant ID. Leaving one Room leaves only that Room's tabs.
- [x] The Room gets `isEmpty()`, counting Participants in their grace period. The registry removes a Room 1 minute after it becomes empty; a join during that minute cancels the removal and the Room keeps its Deck and Round number. After removal, the Room ID gives a new Room with the default Deck.
- [x] Tests with fake timers: an empty Room is still there at 59 s and gone at 60 s; a join at 59 s keeps it, with its Deck; a Participant's grace period delays the removal.
- [x] Checked in a browser on an isolated server with two Rooms in two windows: nothing from one Room shows in the other.
- [x] The planning-poker spec's Socket adapter, HTTP entry and Names sections say Rooms are per URL, and names are unique within a Room.
