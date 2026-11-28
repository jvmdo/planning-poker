# 03: Create Room, and back to the last Room

**What to build:** `/` stops being a Room. A browser with a last Room goes back to it; one without gets the join screen with a **Create Room** button that makes up a random `word-word-number` Room ID and joins it. Browser storage keeps the last Room joined instead of `inRoom`. A URL that names a Room always wins over the last Room: a Room you haven't joined shows the join screen with your name filled in.

**Blocked by:** 02 (A Room per URL)

**Status:** closed

- [x] Browser storage keeps the Participant ID, the name and the last Room joined (one Room). Old data with `inRoom` but no Room counts as no Room, so those browsers see the join screen once, with their name filled in.
- [x] At `/` with a last Room, the browser goes to `/<last room>` (replacing the history entry) and rejoins without the join screen.
- [x] At `/` with no last Room, the join screen names no Room and its button reads **Create Room**. It makes up a random Room ID, goes to it and joins.
- [x] Random Room IDs look like `brave-otter-42`, from two word lists and a number, with at least a few hundred thousand combinations, and always pass the Room ID check (tested).
- [x] At `/<id>` equal to the last Room: rejoin automatically, as today. At any other `/<id>`: the join screen with the stored name filled in; joining makes it the last Room.
- [x] Leave clears the last Room if it is this tab's Room, and shows the join screen for the same Room.
- [x] A reload of a tab in a Room that is no longer the last Room (another tab joined another Room since) shows the join screen with the name filled in. This is expected.
- [x] The planning-poker spec's user story 1, Solution and Client sections describe `/`, Create Room and the last Room.

## Comments

- 2026-11-26: closed by the human (was `ready-for-agent`), without re-checking each box here.
