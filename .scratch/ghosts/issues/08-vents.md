# 08: Vents

**What to build:** Ghosts arrive and leave through vents instead of appearing in the middle of the Table, a nod to the "Vent" button in the Skin picker.
- **Where:** a fixed set of 12 vent spots on the shared Table, in a ring between the Result in the middle and the seats. Each screen turns them like the seats and Ghosts, so a vent next to Bruno's Card is next to it on every screen. They must stay inside the room area on a phone.
- **Which vent:** the owner's browser rolls the dice for each summon and sends the roll with it. The Room gives the new Ghost the free vent that roll picks, so a Ghost comes out of a different vent each time, and the owner's browser can work out the same vent. A summon without a valid roll gets one rolled by the Room. "Free" means no Ghost out is standing on it. When every vent is taken, the Ghost takes one anyway, nudged aside so Ghosts don't stack (the current nudge rule).
- **Coming out:** on every screen, when a Ghost appears between two snapshots, a grate opens on the floor, the Ghost rises out of it with a small bounce, and the grate fades (about 0.6 s in all). Someone joining or reloading just sees the Ghosts already out, with no animation.
- **Going in:** when a Ghost goes, a grate opens under it wherever it stands and it sinks in (about 0.5 s). That covers the "Vent" button, its owner becoming a Voter, leaving, and the grace period running out. A disconnect still only fades the Ghost.
- **Grates:** drawn only while a Ghost comes out or goes in, never permanently. They're our own simple drawing in the app's ink and card colours, like the Vent button's icon. Don't copy art from any existing game.
- **Reduced motion:** Ghosts simply appear and go, with no grate.

See the spec in this folder: user stories 27, 27a and 68, the Room's `summonGhost` decision, and the client's **Vents** bullet. This replaces "new Ghosts appear in the middle, nudged apart".

**Blocked by:** 04

**Status:** closed

- [x] Shared: the vent spots and the vent-picking rule, next to the Ghost definitions in `src/shared/ghost.ts`. It replaces `freeSummonPlace`, keeping its nudge for when every vent is taken. It is the one rule both the Room and the browser use.
- [x] Room: `summonGhost` places the new Ghost at its vent. Nothing else in the Room changes.
- [x] Your own new Ghost still shows at once, before the Room answers, at the vent the Room will use (`withPending` in `src/client/pending.ts`).
- [x] Every screen plays the coming-out animation for a Ghost that arrives, and the going-in animation for one that goes. A departing Ghost stays drawn just long enough to sink.
- [x] A late joiner or a reload sees no animation. A Ghost whose owner disconnects only fades.
- [x] Reduced motion: no grate and no animation.
- [x] Room scenario tests (replacing the "middle of the Table" ones in `src/server/room.test.ts`):
  - a new Ghost comes out at one of the vents;
  - two Ghosts out at once get different vents, and a vent is free again once its Ghost walks off or is put away;
  - a full Room's 30 Ghosts all get a place within reach (`TABLE_REACH`), none on top of another.
- [x] Pending test: the browser's predicted spot for your own new Ghost is the Room's.
- [x] Checked by hand in several browsers, including a turned Voter's screen, a phone width, dark mode and reduced motion, and with the scenario script's bot Observers.

## Notes for whoever picks this up

- **Where Ghosts appear now:** `freeSummonPlace` in `src/shared/ghost.ts`, called by `summonGhost` in `src/server/room.ts`. The browser also calls it in `withPending` (`src/client/pending.ts`) to draw your own new Ghost before the Room answers.
- **Converting positions:** the shared Table runs 0 to 1 on each axis over the Table's box, with seats on its oval edge (`src/client/lib/seat-layout.ts`). `src/client/lib/ghost-frame.ts` converts between it and each screen, turning and clamping. `src/client/lib/ghost-walker.ts` places and walks each Ghost's element.
- **Drawing Ghosts:** `src/client/ghost-layer.tsx` draws them. Today a Ghost's `<li>` mounts when its `ghost` becomes non-null and unmounts when it becomes null. A departing Ghost has to be kept for its exit animation, and a newly arrived one told apart from one already there on the first snapshot.
- **Existing animations:** the bob is `animate-ghost-bob` in `src/client/index.css`, and `motion-reduce:` variants are used for reduced motion.

## Comments

**2026-11-23, agent:** Done. The vents are 8 spots in a ring at 62% of the way out to the seats, offset half a step so they sit between seats. `ventFor` in `src/shared/ghost.ts` replaces `freeSummonPlace`. When every vent is taken, the nudge now searches rings round the Ghost's first vent (sideways 0.1, up and down 0.15) and stays within `TABLE_REACH`. The old middle-anchored row would have left the reach for a full Room nudged round a side vent. `useVenting` (`src/client/use-venting.ts`) keeps a departing Ghost drawn where it stands while it sinks.

I checked it in headless Chromium against a separate server, with socket bots acting as Observers the way the scenario script's do, though I didn't run the script itself. Covered: a desktop Voter; a turned Voter at phone width in dark mode; 11 Ghosts (vents used up, the rest nudged); a late joiner; a Ghost vented mid-walk; a disconnect; a reduced-motion viewer; your own Ghost through the picker; and Vent then "Bring out" again at once.

For a human to look at: the grate art and timings (`[data-venting]` in `src/client/index.css`), and how close the name tags get at phone width once vents run out.

**2026-11-23, agent:** Changed after review by the human: a vent is now picked at random for each summon, not by Participant ID. The browser sends a roll (0 up to 1) with `summonGhost`; the Room uses it, or rolls its own if it's missing or invalid. There are now 12 vents instead of 8. On desktop they space out well; at phone width, with every vent taken, Ghosts on neighbouring vents at the top and bottom of the Table touch name tags.
