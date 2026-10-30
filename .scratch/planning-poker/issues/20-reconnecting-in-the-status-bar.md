# 20: "Reconnecting…" in the status bar

**What to build:** When a Participant's connection drops, "Reconnecting… you'll rejoin automatically." stops appearing as a row in the strip above the table. It moves into the status bar, which has a fixed height, so the table doesn't move. It isn't a toast: it describes a state that lasts until the connection is back, not a one-off event. While it shows, the Facilitator's controls are disabled, since nothing they send would reach the server. This is the second of three tickets that empty the strip; ticket 21 deletes it.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [x] While disconnected, the status bar's second line (normally "N of M Voters played · waiting on …") shows a spinner and "Reconnecting… you'll rejoin automatically." instead. The first line ("Voting" or "Votes revealed") stays.
- [x] While disconnected, the Facilitator's Reveal, New Round and Deck buttons are disabled. They come back as they were once the snapshot after rejoining arrives.
- [x] When the connection is back, the second line returns to the Voters played and who we're waiting on.
- [x] Screen readers announce the reconnecting state, as the strip's message did.
- [x] The "Connecting…" message on the join screen, before joining, is unchanged.
- [x] The "Become Facilitator" banner stays in the strip for now (ticket 21).
- [x] Checked in a browser on a production build by stopping and restarting the server: the message appears in the status bar, the Facilitator's buttons are disabled, everything returns after rejoining, and the table's box doesn't change at 1024×720 or 1920×1080.
