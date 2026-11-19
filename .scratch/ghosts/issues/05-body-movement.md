# 05: Body movement

**What to build:** Walking Ghosts look alive and show their direction.
- **Turning:** a walking Ghost turns to face left or right the way it's going, with a quick flip, and keeps its facing when it walks straight up or down. Its face sits slightly toward the side it faces.
- **Back items:** each disguise carries something on its back, on the side away from the face: a bow on the dress (None), a sword (Ninja), a loot sack (Thief), a small jetpack whose flame shows while walking (Astronaut), a quiver of arrows (Rogue). All are in the fabric's colours.
- **While walking:** it leans about 10° into the walk and swings back past upright when it stops, looks where it's going, trails its tail with a faster sway, flutters its hem and trots instead of floating.
- **Idle:** it floats with a slow, gentle bob.
- **No squash and stretch.**

Each screen poses the Ghost for the way it moves on that screen, since walks are turned like the seats. Nothing crosses the network for this. See the spec in this folder (user stories 40–48) and the walking demo in the art prototype, which this should match.

**Blocked by:** 03, 04

**Status:** ready-for-agent

- [ ] A Ghost walking with noticeable sideways movement faces that way on every screen, as that screen shows the walk. A walk straight up or down keeps its facing.
- [ ] Every disguise shows its back item on the side away from the face, in the fabric's colours. The Astronaut's flame shows only while walking.
- [ ] The lean is proportional to sideways movement (about 10° at most) and settles with a small swing back on stopping.
- [ ] The face shifts toward the direction of travel and recentres when stopped.
- [ ] Tail trail, hem flutter and trot show only while walking; idle shows the slow bob.
- [ ] Reduced motion: no bob, and walks jump straight to the destination.
- [ ] Checked by hand against the walking demo with bot Observers.
