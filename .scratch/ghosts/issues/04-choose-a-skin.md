# 04: Choose a Skin

**What to build:** The Ghost button opens a Skin picker, and every Ghost wears its owner's Skin.
- **Picker:** a popover with a fabric row (Coral stripes, Berry gingham, Sunny suits, Mint dots, Lilac zigzag, Night stars), a disguise row (None, Ninja, Thief, Astronaut, Rogue) and "Put Ghost away". The first time, a random Skin is preselected.
- **Picking:** with no Ghost out, picking summons one in that Skin. With a Ghost out, picking re-dresses it live for everyone.
- **Colours:** each fabric has a main, dark, light and glow colour, and the disguise takes its colours from the fabric.
- **Sharing:** two Observers may wear the same Skin.

See the spec in this folder (user stories 3–10) and the art prototype for every fabric and disguise, drawn as agreed.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] The shared Skin lists hold all six fabrics and five disguises, each with a guard, in the same style as the Throwables.
- [ ] Room: `dressGhost(id, skin)`, rejected with no Ghost or an invalid Skin. Summon and dress reject unknown fabrics or disguises. Each rejection leaves the Room unchanged.
- [ ] A changed Skin shows in every Participant's snapshot.
- [ ] The adapter maps `dressGhost`.
- [ ] The Ghost button opens the picker. It summons, re-dresses or puts away as described, with a random Skin preselected the first time.
- [ ] The Ghost component draws every fabric pattern and every disguise in the fabric's colours, matching the art prototype at about 42px wide. This includes the Rogue's narrow hood flaring over the shoulders.
- [ ] Room scenario tests cover dressing, the rejections, and two Observers sharing a Skin.
