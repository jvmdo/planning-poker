# 02: Summon a Ghost and see it

**What to build:** The thinnest end-to-end Ghost.
- **Summon:** an Observer clicks the Ghost button in the status bar, and a Ghost appears for everyone in the middle of the Table, nudged apart from any other Ghost.
- **Look:** the agreed body (dome and face, Card dress, short tail) in one default fabric with no disguise, with an always-visible name tag and a gentle bob.
- **Watching line:** the owner leaves it while the Ghost is out, and comes back to it when the Ghost is put away.
- **Lifecycle:** becoming a Voter, leaving and grace-period expiry put the Ghost away. A short disconnect fades the Ghost, and a reconnect within the grace period restores it. Late joiners see every Ghost already out.

The Ghost changes nothing in the Round and works during voting and after the Reveal. It can't move or be played with yet. See the spec in this folder (user stories 1–3, 11, 16–23, 26–27, 63–68 for what applies without Skins or memory), and the art prototype next to it for the drawing.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Room: `summonGhost(id, skin)` and `dismissGhost(id)`, with the rejections from the spec (a Voter, an invalid Skin, a Ghost already out, no Ghost to dismiss). Each rejection leaves the Room unchanged.
- [ ] Room: a summoned Ghost starts at the middle of the shared Table, nudged sideways for each other Ghost already out.
- [ ] Each Participant in the snapshot has `ghost: { skin, to } | null`, the same for every recipient.
- [ ] Room: becoming a Voter, leaving and grace expiry put the Ghost away. A disconnect keeps it, and a reconnect within the grace period restores it unchanged (fake timers).
- [ ] The Skin lists start with the one default fabric and "None" for the disguise. Ticket 04 adds the rest.
- [ ] The socket adapter maps the two new commands and sends rejections to the sender only.
- [ ] The status bar shows a Ghost button to Observers only: summon when no Ghost is out, put away when one is, highlighted while out. It sits left of the Facilitator controls when they're there, and shows only an icon on narrow screens.
- [ ] A Ghost layer over the room area draws each Ghost (about 42px wide) at its position on the Table for an Observer's view, above the Table and below the Hand and toasts. It ignores the pointer except on the Ghosts.
- [ ] The Watching line leaves out Observers whose Ghost is out.
- [ ] An away owner's Ghost is drawn faded.
- [ ] Room scenario tests cover summon and dismiss from both the owner's and another Participant's snapshot, every rejection, and the lifecycle rules.
