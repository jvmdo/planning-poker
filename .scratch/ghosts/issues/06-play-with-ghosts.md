# 06: Play with Ghosts

**What to build:** Ghosts join the Reactions and Throws.
- **Reactions:** an Observer clicks their own Ghost to open the Reaction deck, and Reactions float up from the Ghost.
- **Throws at a Ghost:** anyone clicks someone else's Ghost to open the Throw deck.
- **Throws from a Ghost:** they fly from wherever the Ghost is, at any Voter's Card or any other Ghost, including away ones.
- **Homing:** a Throw at a walking Ghost chases it, frame by frame in each browser, so it hits on every screen. The Ghost then wobbles in place.
- **Unchanged:** Observers without a Ghost still can't react or be thrown at, nobody can Throw at themselves, and the shared burst limit covers it all.

See the spec in this folder (user stories 49–62).

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Room: an Observer with a Ghost may react; without one, the existing refusal stands.
- [ ] Room: a Throw at an Observer with a Ghost is accepted; without one, the existing refusal stands. A Throw at yourself is still refused. The Reaction and Throw event is unchanged.
- [ ] Ghost Reactions and Throws spend the same burst as everyone's.
- [ ] Room scenario tests cover each new rule from both sides, in the style of the existing Reaction and Throw tests.
- [ ] Your own Ghost opens the Reaction deck and anyone else's opens the Throw deck, reusing the seat decks, by pointer and keyboard.
- [ ] Through ticket 01's Participant-place lookup, a Ghost is where its owner's Reactions and Throws start and where Throws at them land. Observers without a Ghost still throw from the Watching line.
- [ ] The Throw animation is frame-driven and re-reads the target's on-screen position every frame, so a walking Ghost is always hit. Throws at Cards look as before.
- [ ] A hit Ghost wobbles and settles where it was.
