# 21: "Become Facilitator" in the status bar, and the strip removed

**What to build:** When the Room has no Facilitator, the "Become Facilitator" banner stops appearing above the table and moves into the status bar. Its right side normally holds the Facilitator's controls, and nobody has them while the role is empty. The status bar explains what happened and offers the button to everyone, first click wins, as today (user stories 39 and 40). With the notices (ticket 19) and the connection message (ticket 20) already moved, the strip between the status bar and the table is deleted, so the table only changes size with the window.

**Blocked by:** 19 (Notices as a toast), 20 ("Reconnecting…" in the status bar).

**Status:** ready-for-agent

- [x] While the Room has no Facilitator, the status bar's second line reads "The Facilitator left and the Round was discarded." and a **Become Facilitator** button sits on the right, where Reveal, New Round and Deck normally are. Everyone sees it, Voters and Observers alike.
- [x] Claiming works as today: the first click wins, and a late click gets the existing "Someone else became the Facilitator first." notice, now a toast. The new Facilitator's controls replace the button.
- [x] If the connection is down at the same time, "Reconnecting…" takes the second line (ticket 20) and the button is disabled until the connection is back.
- [x] The strip above the table is deleted, and nothing else renders between the status bar and the table.
- [x] The spec's Client section describes where the notices, the connection message and the "Become Facilitator" button now live.
- [x] Checked in a browser on a production build at 1024×720, 1366×768 and 1920×1080: the table's box is identical through a notice, a reconnect and a lost Facilitator being replaced. To lose the Facilitator, close their browser and wait out the 30-second grace period.
