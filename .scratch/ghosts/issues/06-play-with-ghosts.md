# 06: Play with Ghosts

**What to build:** Ghosts join the Reactions and Throws.
- **Reactions:** an Observer clicks their own Ghost to open the Reaction menu, and Reactions float up from the Ghost.
- **Throws at a Ghost:** anyone clicks someone else's Ghost to open the Throw menu.
- **Throws from a Ghost:** they fly from wherever the Ghost is, at any Voter's Card or any other Ghost, including away ones.
- **Homing:** a Throw at a walking Ghost chases it, frame by frame in each browser, so it hits on every screen. The Ghost then wobbles in place.
- **Unchanged:** Observers without a Ghost still can't react or be thrown at, nobody can Throw at themselves, and the shared burst limit covers it all.

See the spec in this folder (user stories 49–62).

**Blocked by:** 03

**Status:** closed

- [x] Room: an Observer with a Ghost may react; without one, the existing refusal stands.
- [x] Room: a Throw at an Observer with a Ghost is accepted; without one, the existing refusal stands. A Throw at yourself is still refused. The Reaction and Throw event is unchanged.
- [x] Ghost Reactions and Throws spend the same burst as everyone's.
- [x] Room scenario tests cover each new rule from both sides, in the style of the existing Reaction and Throw tests.
- [x] Your own Ghost opens the Reaction menu and anyone else's opens the Throw menu, reusing the seat menus, by pointer and keyboard.
- [x] Through ticket 01's Participant-place lookup, a Ghost is where its owner's Reactions and Throws start and where Throws at them land. Observers without a Ghost still throw from the Watching line.
- [x] The Throw animation is frame-driven and re-reads the target's on-screen position every frame, so a walking Ghost is always hit. Throws at Cards look as before.
- [x] A hit Ghost wobbles and settles where it was.

## Comments

- 2026-11-26: closed by the human (was `ready-for-human`), without re-checking each box here.
