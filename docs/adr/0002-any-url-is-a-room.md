# Any URL is a Room, removed a minute after it empties

Every path such as `/team-alpha` names a Room, and the Room is created when its first Participant joins: there is no "create" step on the server, no list of Rooms and no passcode. The **Create Room** button at `/` only makes up a Room ID in the browser and joins it, like typing a URL. Knowing the Room ID is the only way in, so the Rooms the app makes up itself get hard-to-guess `word-word-number` IDs, while teams can still type a memorable one. A Room is removed one minute after its last Participant is gone (after their grace period), so a team that drops off together comes back to the same Deck.

## Considered Options

- **A "New Room" button and server-issued IDs only**: rejected. Typing `/team-alpha` is how a team gets a Room it can bookmark. A button that asks the server to create a Room adds nothing a made-up ID doesn't, which is why Create Room only makes one up.
- **Numeric Room IDs**: rejected. With no passcode, an ID that's easy to guess is a Room strangers wander into.
- **Keeping empty Rooms forever, as the single Room did**: rejected. Anyone can create Rooms by visiting URLs, so they must go away on their own.

## Consequences

- Visiting URLs mustn't fill the server's memory: Rooms exist only once someone joins, and the server refuses new Rooms past 100 and new Participants past 30 in a Room. The free instance's CPU, spent sending each Participant their own snapshot, is the real limit, not memory.
- Only a Room's own Participants may receive anything from it. Snapshots, Reactions, Throws and Deck changes are sent to that Room's connections, never to every connection on the server.
