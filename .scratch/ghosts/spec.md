# Spec: Ghosts

Status: ready-for-agent

## Problem Statement

Observers watch the Room but have nothing of their own at the Table. Voters have a seat and a Card; Observers are only a name on the "Watching" line, and their Throws come from there. Observers want a playful presence of their own: something they can dress up, walk around the Table, and throw things from, which the whole team sees and can throw things back at.

## Solution

An Observer can choose to have a **Ghost**: a small character, seen by everyone with its owner's name, that they walk anywhere around the Table. Each Observer picks their Ghost's **Skin**: a dress fabric and a disguise. While the Ghost is out, it is where that Observer is on the Table: their Reactions float up from it, their Throws fly from it, and anyone can Throw at it. A Ghost hovering over Bruno's Card is over Bruno's Card on every screen, Bruno's included. Ghosts turn, lean and trot as they walk, and work during every part of the Round, Reveal included, without changing anything in it.

The vocabulary below is defined in the glossary (**Ghost**, **Hand**, **Reaction**, **Throw**, **Observer**, **Table**).

## User Stories

### Having a Ghost

1. As an Observer, I want a Ghost button in the status bar, so that I can bring out a Ghost whenever I feel like it.
2. As a Participant, I want nobody to get a Ghost without asking for one, so that Observers who just want to watch stay out of the way.
3. As an Observer, I want the Ghost button to open a Skin picker, so that I choose how my Ghost looks before it appears.
4. As an Observer, I want to pick a fabric for my Ghost's dress (Coral stripes, Berry gingham, Sunny suits, Mint dots, Lilac zigzag, Night stars), so that my Ghost is recognisably mine.
5. As an Observer, I want to pick a disguise for my Ghost (None, Ninja, Thief, Astronaut, Rogue), so that I can give it some personality.
6. As an Observer, I want the disguise to take its colours from the fabric I picked, so that the whole Skin looks like one outfit.
7. As an Observer opening the picker for the first time, I want a random Skin already selected, so that one click summons a Ghost.
8. As an Observer, I want to change my Skin while my Ghost is out, so that I can restyle it without putting it away.
9. As a Participant, I want to see a Ghost's new Skin as soon as its owner changes it, so that everyone sees the same Ghost.
10. As a Participant, I want two Observers to be allowed the same Skin, so that nobody is told their favourite is taken.
11. As an Observer, I want a button in the same picker to put my Ghost away ("Vent"), so that I can go back to quietly watching.
12. As an Observer, I want my browser to remember that I want a Ghost, and which Skin, so that it comes back after a reload without setting it up again.
13. As an Observer, I want that memory to apply in every Room, so that my Ghost comes with me to any team's meeting.
14. As an Observer who switches to Voter for a Round and back, I want my Ghost to come back, so that a quick vote doesn't cost me my Ghost.
14a. As an Observer whose grace period ran out, or whose Room was emptied by a server restart, I want to come back to that Room as an Observer, so that my Ghost comes back too. Other Rooms still start me as a Voter.
15. As an Observer, I want my browser to forget my Ghost only when I put it away myself, so that being removed or a server restart doesn't change my preference.
16. As an Observer who is also the Facilitator, I want the Ghost button next to my Reveal, New Round and Deck controls, so that I can run the Room and still have a Ghost.
17. As an Observer on a narrow screen, I want the Ghost button to shrink to an icon, so that the status bar still fits.
18. As a Voter, I want no Ghost button, so that a control I can't use doesn't clutter my status bar.

### Seeing Ghosts

19. As a Participant, I want to see every Ghost in the Room, so that I know which Observers are playing.
20. As a Participant, I want every Ghost to carry an always-visible name tag, so that I know who is haunting the Table, even on a phone with no hover.
21. As a Participant, I want an Observer whose Ghost is out to leave the "Watching" line, so that their name isn't shown twice.
22. As a Participant, I want an Observer to return to the "Watching" line when they put their Ghost away, so that I can still see they're there.
23. As a Participant who joins late or reloads, I want to see every Ghost already out, where it is, so that my screen matches everyone else's.
24. As a Participant, I want a Ghost over a Voter's Card to be over that same Card on my screen, whoever I am, so that "Davi is haunting Bruno" is true for everyone.
25. As the Voter whose Card is being haunted, I want to see the Ghost over my own Card, so that I know it's me being teased.
26. As a Participant, I want Ghosts to be slightly see-through and small, so that the Result in the middle of the Table stays readable even with a Ghost parked on it.
27. As a Participant, I want a new Ghost to climb out of a vent that opens at a random spot on the Table, a different vent from other Ghosts, so that I notice it arrive and Ghosts don't stack.
27a. As a Participant, I want a Ghost that goes away to sink into a vent that opens under it, wherever it stands, so that arrivals and departures match.

### Moving

28. As an Observer with a Ghost, I want to click or tap any empty spot in the room area and see my Ghost walk there, so that moving works with a mouse and on a phone.
29. As an Observer with a Ghost, I want clicks on Cards, seats, buttons and the Hand to keep doing what they do, so that walking never gets in the way of anything else.
30. As an Observer with a Ghost, I want to walk it with the arrow keys, a short hop per press, so that I can play from the keyboard.
31. As an Observer with a Ghost, I want my Ghost to start walking as soon as I click, so that it feels responsive even on a slow connection.
32. As a Participant, I want Ghosts to walk at a steady speed, crossing the Table in about 1.5 seconds, so that a long trip takes longer than a short one.
33. As a Participant, I want Ghosts to start and stop gently, so that walking looks like floating rather than sliding.
34. As a Participant, I want a Ghost to be able to go anywhere in the room area, including over seats and the Result, so that Observers can haunt anything at the Table.
35. As a Participant, I want Ghosts to stay out of the sidebar and the status bar, so that controls are never covered.
36. As a Voter, I want Ghosts to pass under the Hand, so that a Ghost never blocks my vote.
37. As a Participant, I want Ghosts to pass under toasts, so that notices stay readable.
38. As a Participant on a screen of a different size or shape, I want a Ghost that is far out at the edge on someone else's screen to sit at the edge of mine, so that it is always on my screen.
39. As a Participant, I want an Observer's rapid moves (such as a held arrow key) to be capped, so that one Observer can't flood the Room with moves.

### Body movement

40. As a Participant, I want a walking Ghost to turn to face left or right the way it's going, so that I can tell its direction at a glance.
41. As a Participant, I want each disguise to carry something on its back (a bow, a sword, a loot sack, a jetpack, a quiver), so that a turned Ghost clearly shows which way it faces.
42. As a Participant, I want a Ghost walking straight up or down to keep facing the way it was, so that it doesn't flip for no reason.
43. As a Participant, I want a walking Ghost to lean into the walk and swing back with a small wobble when it stops, so that it feels alive.
44. As a Participant, I want a walking Ghost to look where it's going, so that its direction also shows on its face.
45. As a Participant, I want a walking Ghost's tail to trail behind it, so that it reads as moving.
46. As a Participant, I want a walking Ghost's hem to flutter and its bob to become a quicker trot, so that walking and idling look different.
47. As a Participant, I want an idle Ghost to bob gently, so that it looks like it's floating even when it's still.
48. As a Participant, I want each screen to pose the Ghost for the way it moves on that screen, so that its facing and lean always match what I see.

### Fun

49. As an Observer with a Ghost, I want to click my own Ghost to open the Reaction menu, so that I can react like a Voter does from their Card.
50. As an Observer with a Ghost, I want my Reactions to float up from my Ghost, so that everyone sees who reacted and where.
51. As an Observer without a Ghost, I want Reactions to stay unavailable, so that the rule stays "Reactions come from your place at the Table".
52. As an Observer with a Ghost, I want my Throws to fly from my Ghost, wherever it is, so that the Ghost is where the fun comes from.
53. As an Observer with a Ghost, I want to Throw at any Voter's Card from anywhere, so that I don't have to walk over to someone first.
54. As an Observer with a Ghost, I want to Throw at other Ghosts, so that Observers can tease each other.
55. As a Participant, I want to click someone else's Ghost to open the Throw menu, so that throwing at a Ghost works like throwing at a Card.
56. As a Participant, I want to be able to Throw at an away Ghost, so that it works like throwing at an away Voter's Card.
57. As a Participant, I want Throws at Observers without a Ghost to stay refused, so that quiet watchers are left alone.
58. As a Participant, I want a Throw at a walking Ghost to chase it and hit it on every screen, so that everyone agrees it was a hit.
59. As a Participant, I want a Ghost to wobble when hit and then settle where it was, so that hits feel good without moving the Ghost.
60. As a Participant, I want Ghost Reactions and Throws to share the existing burst limit, so that a Ghost can't flood everyone's screen.
61. As a Participant, I want Ghosts to work during voting and after the Reveal alike, so that the fun doesn't stop at any point in the Round.
62. As a Participant, I want Ghosts to change nothing in the Round, so that playing never affects the estimate.

### Lifecycle

63. As an Observer whose connection drops briefly, I want my Ghost to stay where it was, so that a reload doesn't cost me my place.
64. As a Participant, I want an away Observer's Ghost to look faded, so that I know they're temporarily away, like other away markers.
65. As an Observer back within the grace period, I want my Ghost exactly as I left it, so that a Wi-Fi blip is invisible.
66. As an Observer who becomes a Voter, I want my Ghost put away, because only Observers have Ghosts.
67. As a Participant, I want a Ghost to disappear when its owner leaves or is removed after the grace period, so that no Ghost stays without an owner.
68. As an Observer whose Ghost comes back (after switching from Voter, after the grace period, or after a server restart), I want it to climb out of a vent, so that everyone notices I'm back.

## Implementation Decisions

### Shared contract

- New shared Ghost definitions next to the existing Reaction and Throw definitions: the list of fabrics and the list of disguises, each with a guard, in the same style as the Throwables. A **Skin** is a fabric plus a disguise.
- **The shared Table:** a Ghost's position is a point relative to the Table's box, 0 to 1 on each axis, with seats in Room order and the first Voter at the bottom. This is exactly what an Observer's screen shows. Points from −0.5 to 1.5 are accepted on each axis, which covers the room area around the Table and under the Hand on any screen.
- **Snapshot:** each Participant gains `ghost: { skin, to } | null`, where `to` is the point the Ghost is heading for.
- **New server-to-client event:** `ghostMoved` (which Ghost, and its new `to`), broadcast within the Room like the Reaction and Throw event, since it holds no Votes.
- **New client-to-server commands:** `summonGhost(skin)`, `dressGhost(skin)`, `dismissGhost()`, `moveGhost(to)`.
- **Move limit:** a burst of 10 moves, then one more every 100 ms. It reuses the existing burst rule with its own budget, separate from Reactions and Throws.

### Room module (server)

- **New commands:**
  - `summonGhost(id, skin)`. Rejected for a Voter, an invalid Skin, or a Ghost already out. The Room places the new Ghost at a free vent spot picked by a roll of the dice that the owner's browser sends with the summon, so each summon comes out of a vent picked at random, and the owner's browser can show it there at once. Without a valid roll (a bot, say), the Room rolls its own. When every vent has a Ghost on it, it takes one anyway and is nudged aside.
  - `dressGhost(id, skin)`. Rejected with no Ghost or an invalid Skin.
  - `dismissGhost(id)`. Rejected with no Ghost.
  - `moveGhost(id, to)`. Rejected with no Ghost, a point that isn't two finite numbers in range, or the move limit spent.
- **Snapshots:** summon, dress and dismiss change them. An accepted move doesn't. It goes to a separate ghost subscriber as a one-off event, like Reactions and Throws do, but the Room keeps the latest `to` so snapshots carry it for late joiners.
- **Lifecycle:** becoming a Voter, leaving and grace-period expiry put the Ghost away. A disconnect keeps it, and a reconnect within the grace period restores it as it was.
- **Reactions:** an Observer with a Ghost may react. Without one, the existing "Observer cannot react" refusal stands.
- **Throws:** throwing at an Observer with a Ghost is allowed. At an Observer without one, the existing refusal stands. Throwing at yourself is still refused. The Reaction and Throw event shape doesn't change.

### Socket adapter

- Thin glue as before: map the four new commands, broadcast `ghostMoved` within the Room, and send rejections to the sender only. The client doesn't show toasts for rejected moves.

### Client

- **Ghost frame**, a new pure module that converts between the shared Table and a screen. A Voter's screen turns the Table so their own seat is at the bottom. Seats sit around the oval at even angles, so a Voter whose seat is k-th in Room order sees the shared Table turned back by k seat-steps. Converting a point:
  1. map the Table box onto a unit circle
  2. rotate it by the viewer's turn
  3. map it back
  4. clamp it to this screen's room area

  Converting a screen point back is the reverse. Observers, including every Ghost owner, have no turn. Walks are turned the same way, so each screen may show a walk in a different direction, but always between the same seats.
- **Ghost layer:** an overlay across the room area, below the status bar, drawn above the Table but below the Hand and toasts. It ignores the pointer except on the Ghosts themselves.
- **Vents:** fixed spots on the shared Table, turned per screen like Ghosts. A Ghost that appears between two snapshots climbs out of a grate that opens and then fades; one that goes (put away, its owner becomes a Voter, leaves, or their grace period runs out) sinks into a grate under it. Someone joining late just sees the Ghosts already out. A disconnect still only fades the Ghost. Reduced motion: Ghosts simply appear and go.
- **Walking:** each screen animates from where the Ghost is drawn to the new destination, frame by frame, at a constant speed measured on the shared Table (one Table width per 1.5 s), easing in and out. The owner's screen starts the walk on the click, before the server answers.
- **Input:** a click on empty room space (not a seat, Card, control or the Hand) moves your own Ghost. Arrow keys hop a tenth of the Table from anywhere on the page, except while focus is somewhere that needs them (a text field, a dialog, or a control that uses arrow keys itself) or a modifier key is held.
- **Menus:** your own Ghost opens the Reaction menu, and anyone else's opens the Throw menu. Both reuse the seat menus.
- **Throws and Reactions:** they start from the thrower's Ghost when it's out, otherwise from the Watching line as today. A Ghost target is the Ghost as drawn on that screen. The Throw animation becomes frame-driven and re-reads the target's on-screen position every frame, so it homes in on a walking Ghost. This is all local to each browser, with nothing extra on the network. A hit Ghost wobbles in place.
- **Watching line:** it leaves out Observers whose Ghost is out.
- **Away:** a disconnected owner's Ghost is drawn faded.
- **Status bar:** a Ghost button on the right side, shown only to Observers and highlighted while your Ghost is out. It sits left of the Facilitator controls when they're there, and shows only its icon on narrow screens. It opens a popover with a preview, a fabric row, a disguise row, "Bring out Ghost" or "Wear this", and, while the Ghost is out, a "Vent" button in its top corner that puts it away (a nod to hopping into a vent), with a toast for its owner: "Folded and vented. Nobody suspects a thing." Picking a swatch only tries it on in the preview; the button applies it (summoning or re-dressing) and closes the popover. Like a Vote or a role change, your own Ghost shows a summon, a new Skin or being put away at once, before the server answers.
- **Remembering:** the identity the browser already stores (Participant ID, name, Last Room) also stores the wanted Skin, or none. Picking a Skin sets it, and "Vent" (putting the Ghost away) clears it. Whenever the browser is an Observer, wants a Ghost and has none out (after joining, reconnecting or switching back from Voter), it summons one.
- **Art:** one Ghost SVG component, built from the art prototype kept next to this spec in the issue tracker, which also contains a working walking demo.
  - **Body:** Sheet's dome and face, a Card worn as a long dress with a wavy hem in the fabric's pattern, and a short wisp tail peeking out under the hem.
  - **Disguises:** Ninja (face wrap and headband), Thief (domino mask and beanie), Astronaut (bubble helmet with antenna) and Rogue (narrow hood flaring over the shoulders, a pale mask, glowing eyes).
  - **Colours:** each fabric has a main, dark, light and glow colour, and the disguises take theirs from the fabric.
  - **Size:** about 42px wide on the Table.
- **Back items:** one per disguise, in the fabric's colours: a bow on the dress (None), a sword (Ninja), a loot sack (Thief), a small jetpack whose flame shows while walking (Astronaut), a quiver of arrows (Rogue).
- **Body movement:** each screen works this out from the motion on that screen.
  - **Turning:** the Ghost faces right or left. It flips, with a quick turn, when a walk moves noticeably sideways, and keeps its facing when it walks straight up or down. Its face sits slightly toward the side it faces, with the back item on the other side.
  - **Leaning:** about 10° into the walk, in proportion to the sideways movement, with a small swing back past upright when it stops.
  - **Looking:** the face shifts slightly toward where it's going, and recentres when it stops.
  - **Tail:** while walking, it trails behind and sways faster.
  - **Hem:** it flutters while walking.
  - **Bob:** a quicker, smaller trot while walking, and a slow float when idle.
  - **No squash and stretch.**
- **Reduced motion:** no bob, and walks jump straight to the destination. Nothing beyond that.

## Testing Decisions

- **What makes a good test here:** it drives a module only through its public interface and asserts only on what callers can observe. It never reaches into internal state, so internals can be refactored freely. A good Room test reads like a meeting scenario: "Davi, an Observer, summons a Ghost in Berry gingham; Ana's snapshot shows Davi's Ghost at one of the vents; Davi moves it; the ghost subscriber receives the move once; Ana's snapshot is unchanged until the next state change, and then carries the new destination."
- **The Room module**, the existing main seam, through its commands, `snapshotFor` and the ghost subscriber:
  - summon, dress, move and dismiss, seen from both the owner's and other Participants' snapshots
  - every rejection listed above, each showing the Room unchanged
  - becoming a Voter, leaving and grace expiry put the Ghost away; a reconnect within the grace period keeps it (fake timers)
  - the new Reaction and Throw rules: an Observer with a Ghost can react and be thrown at; one without still can't
  - the move limit (fake timers): 10 moves in a row accepted and an 11th rejected, then one more accepted 100 ms later
  - prior art: the existing Room scenario tests, especially the Reaction and Throw tests and the burst-limit tests with fake timers
- **The Ghost frame module**, a new seam for pure client arithmetic that the Room can't reach:
  - a point over seat i on the shared Table lands over seat i on every Voter's screen, for several Room sizes
  - converting to a screen and back gives the original point
  - clamping keeps points inside the room area
  - prior art: the existing unit tests for the client's vote marks, which also test pure client-side logic directly
- **No socket adapter or UI tests**, as for the rest of the app. The walking, posing, homing and picker are checked by hand with several browsers, and with bot Observers added to the existing scenario script.

## Out of Scope

- **Hiding Ghosts for yourself.** If wanted later, it would be a "Show Ghosts" switch in the sidebar, kept per browser like the theme. The Ghost layer simply isn't drawn, and Throws from a Ghost start from the Watching line instead. It's client-only.
- **A Ghost following the Card it hovers over** when seats spread out or close up because someone joins or leaves. For now the Ghost stays where it is on the shared Table.
- Ghosts bumping into each other.
- Voters having a character of their own.
- Skins beyond the six fabrics and five disguises, or Skins people draw themselves.
- Remembering where a Ghost was across visits; a returning Ghost always climbs out of a vent.
- Vents drawn on the Table all the time; a grate shows only while a Ghost comes out or goes in.
- Sound.
- Accessibility beyond keyboard walking, name tags and the reduced-motion rule above.

## Further Notes

- "ghost" was used loosely for someone who disconnected (some test fixture IDs in the Room tests, and a line in the original Planning Poker spec), and "ghost" is also a button style. **Ghost** now means only this feature. Rename those fixture IDs (for example to "stranger") as part of this work.
- The art is our own. Don't copy characters or looks from existing games.
- Positions on the shared Table follow the seat layout's rule that each Voter sits at the bottom of their own screen. If that rule ever changes, the Ghost frame module is the one place to update.
