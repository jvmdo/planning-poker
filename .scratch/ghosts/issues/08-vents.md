# 08: Vents

**What to build:** Ghosts arrive and leave through vents instead of appearing in the middle of the Table, a nod to the "Vent" button in the Skin picker.
- **Where:** a fixed set of about 8 vent spots on the shared Table, in a ring between the Result in the middle and the seats. Each screen turns them like the seats and Ghosts, so a vent next to Bruno's Card is next to it on every screen. They must stay inside the room area on a phone.
- **Which vent:** the Room gives a new Ghost the first free vent in an order shuffled by its owner's Participant ID. It feels random, but the owner's browser can work out the same vent. "Free" means no Ghost out is standing on it. When every vent is taken, the Ghost takes one anyway, nudged aside so Ghosts don't stack (the current nudge rule).
- **Coming out:** on every screen, when a Ghost appears between two snapshots, a grate opens on the floor, the Ghost rises out of it with a small bounce, and the grate fades (about 0.6 s in all). Someone joining or reloading just sees the Ghosts already out, with no animation.
- **Going in:** when a Ghost goes, a grate opens under it wherever it stands and it sinks in (about 0.5 s). That covers the "Vent" button, its owner becoming a Voter, leaving, and the grace period running out. A disconnect still only fades the Ghost.
- **Grates:** drawn only while a Ghost comes out or goes in, never permanently. They're our own simple drawing in the app's ink and card colours, like the Vent button's icon. Don't copy art from any existing game.
- **Reduced motion:** Ghosts simply appear and go, with no grate.

See the spec in this folder: user stories 27, 27a and 68, the Room's `summonGhost` decision, and the client's **Vents** bullet. This replaces "new Ghosts appear in the middle, nudged apart".

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Shared: the vent spots and the vent-picking rule, next to the Ghost definitions in `src/shared/ghost.ts`. It replaces `freeSummonPlace`, keeping its nudge for when every vent is taken. It is the one rule both the Room and the browser use.
- [ ] Room: `summonGhost` places the new Ghost at its vent. Nothing else in the Room changes.
- [ ] Your own new Ghost still shows at once, before the Room answers, at the vent the Room will use (`withPending` in `src/client/pending.ts`).
- [ ] Every screen plays the coming-out animation for a Ghost that arrives, and the going-in animation for one that goes. A departing Ghost stays drawn just long enough to sink.
- [ ] A late joiner or a reload sees no animation. A Ghost whose owner disconnects only fades.
- [ ] Reduced motion: no grate and no animation.
- [ ] Room scenario tests (replacing the "middle of the Table" ones in `src/server/room.test.ts`):
  - a new Ghost comes out at one of the vents;
  - two Ghosts out at once get different vents, and a vent is free again once its Ghost walks off or is put away;
  - a full Room's 30 Ghosts all get a place within reach (`TABLE_REACH`), none on top of another.
- [ ] Pending test: the browser's predicted spot for your own new Ghost is the Room's.
- [ ] Checked by hand in several browsers, including a turned Voter's screen, a phone width, dark mode and reduced motion, and with the scenario script's bot Observers.

## Notes for whoever picks this up

- **Where Ghosts appear now:** `freeSummonPlace` in `src/shared/ghost.ts`, called by `summonGhost` in `src/server/room.ts`. The browser also calls it in `withPending` (`src/client/pending.ts`) to draw your own new Ghost before the Room answers.
- **Converting positions:** the shared Table runs 0 to 1 on each axis over the Table's box, with seats on its oval edge (`src/client/lib/seat-layout.ts`). `src/client/lib/ghost-frame.ts` converts between it and each screen, turning and clamping. `src/client/lib/ghost-walker.ts` places and walks each Ghost's element.
- **Drawing Ghosts:** `src/client/ghost-layer.tsx` draws them. Today a Ghost's `<li>` mounts when its `ghost` becomes non-null and unmounts when it becomes null. A departing Ghost has to be kept for its exit animation, and a newly arrived one told apart from one already there on the first snapshot.
- **Existing animations:** the bob is `animate-ghost-bob` in `src/client/index.css`, and `motion-reduce:` variants are used for reduced motion.
