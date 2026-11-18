# 04: Room ID and Share link in the status bar

**What to build:** The status bar shows which Room you're in, with a button that copies the Share link, and the tab title names the Room.

**Blocked by:** 02 (A Room per URL)

**Status:** ready-for-agent

- [ ] The status bar reads `team-alpha [copy] · Voting` (or the Round's current state). A Room ID longer than about 16 characters is cut short with "…", and the full ID shows on hover.
- [ ] The copy button puts the Room's full URL on the clipboard and shows "Link copied" in the existing toast. It has an accessible label ("Copy Share link") and works by keyboard.
- [ ] If the clipboard can't be written (an insecure origin such as plain-HTTP LAN access), the toast says so and shows the URL to copy by hand.
- [ ] The tab title is `team-alpha · Planning Poker`, with the Room ID cut short after 24 characters. The join screen's title names the Room it's joining.
- [ ] Checked in a browser on a production build at 1024×720, 1366×768 and 1920×1080, with a 40-character Room ID: the status bar doesn't wrap or push the Facilitator's controls, and the table's box doesn't change.
- [ ] The planning-poker spec's Client section describes the Room ID and the copy button in the status bar.
