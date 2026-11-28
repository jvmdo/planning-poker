# 02: Summon a Ghost and see it

**What to build:** The thinnest end-to-end Ghost.
- **Summon:** an Observer clicks the Ghost button in the status bar, and a Ghost appears for everyone in the middle of the Table, nudged apart from any other Ghost.
- **Look:** the agreed body (dome and face, Card dress, short tail) in one default fabric with no disguise, with an always-visible name tag and a gentle bob.
- **Watching line:** the owner leaves it while the Ghost is out, and comes back to it when the Ghost is put away.
- **Lifecycle:** becoming a Voter, leaving and grace-period expiry put the Ghost away. A short disconnect fades the Ghost, and a reconnect within the grace period restores it. Late joiners see every Ghost already out.

The Ghost changes nothing in the Round and works during voting and after the Reveal. It can't move or be played with yet. See the spec in this folder (user stories 1–3, 11, 16–23, 26–27, 63–68 for what applies without Skins or memory), and the art prototype next to it for the drawing.

**Blocked by:** 01

**Status:** closed

- [x] Room: `summonGhost(id, skin)` and `dismissGhost(id)`, with the rejections from the spec (a Voter, an invalid Skin, a Ghost already out, no Ghost to dismiss). Each rejection leaves the Room unchanged.
- [x] Room: a summoned Ghost starts at the middle of the shared Table, nudged sideways for each other Ghost already out.
- [x] Each Participant in the snapshot has `ghost: { skin, to } | null`, the same for every recipient.
- [x] Room: becoming a Voter, leaving and grace expiry put the Ghost away. A disconnect keeps it, and a reconnect within the grace period restores it unchanged (fake timers).
- [x] The Skin lists start with the one default fabric and "None" for the disguise. Ticket 04 adds the rest.
- [x] The socket adapter maps the two new commands and sends rejections to the sender only.
- [x] The status bar shows a Ghost button to Observers only: summon when no Ghost is out, put away when one is, highlighted while out. It sits left of the Facilitator controls when they're there, and shows only an icon on narrow screens.
- [x] A Ghost layer over the room area draws each Ghost (about 42px wide) at its position on the Table for an Observer's view, above the Table and below the Hand and toasts. It ignores the pointer except on the Ghosts.
- [x] The Watching line leaves out Observers whose Ghost is out.
- [x] An away owner's Ghost is drawn faded.
- [x] Room scenario tests cover summon and dismiss from both the owner's and another Participant's snapshot, every rejection, and the lifecycle rules.

## Comments

**Implemented (2026-11-23).** Choices worth knowing:
- **Default Skin:** Coral stripes with no disguise (`DEFAULT_SKIN` in `src/shared/ghost.ts`). Ticket 04 adds the other fabrics and disguises and the random first pick.
- **Where new Ghosts appear:** the middle, then 0.1 of the Table's width either side in turn. Each new Ghost takes the first place no Ghost out is standing on, so one put away leaves a gap the next one fills. A full row (out to the edge of the room area) starts another just below, so all 30 of a full Room fit.
- **Lining up with the Table:** the Ghost layer repeats the room area's padding (one shared constant in `room-table.tsx`), so its inner box is exactly the Table's box and a point on the shared Table places a Ghost with plain percentages. Ticket 03's Ghost frame can measure from that box.
- **The Hand** now sits above the room area (`z-20`), so once Ghosts can walk (ticket 03) they pass under it. Toasts are above the layer by DOM order.
- **Throws from a Ghost:** an Observer whose Ghost is out has left the Watching line, so their Throws now start from their Ghost. Without this they'd have started from a line they're no longer on, or not at all. Throwing at a Ghost and reacting from one are still ticket 06's.
- **Not yet drawn:** the bow (None's back item) and the idle tail sway, which belong with body movement (ticket 05).
- Added **Skin** to the glossary.

Checked in the browser (separate server, light and dark, wide and narrow): five Participants, two Observers summon Ghosts, which appear side by side in the middle for every Voter and Observer; the Watching line drops them; the button is highlighted and shows only its icon at 640px; a tomato from Davi flies from his Ghost; closing Eva's page fades her Ghost; Davi putting his away brings him back to the Watching line.

**Closed (2026-11-23).**
