# 04: Choose a Skin

**What to build:** The Ghost button opens a Skin picker, and every Ghost wears its owner's Skin.
- **Picker:** a popover with a fabric row (Coral stripes, Berry gingham, Sunny suits, Mint dots, Lilac zigzag, Night stars), a disguise row (None, Ninja, Thief, Astronaut, Rogue) and a "Vent" button that puts the Ghost away, with the toast "Folded and vented. Nobody suspects a thing." The first time, a random Skin is preselected.
- **Picking:** fabric and disguise picks are tried on in the picker's preview only. "Bring out Ghost" (no Ghost out) or "Wear this" (Ghost out) applies them for everyone and closes the picker, as does "Vent". Closing it any other way drops what was tried on. Your own screen shows each change at once, before the server answers.
- **Colours:** each fabric has a main, dark, light and glow colour, and the disguise takes its colours from the fabric.
- **Sharing:** two Observers may wear the same Skin.

See the spec in this folder (user stories 3–10) and the art prototype for every fabric and disguise, drawn as agreed.

**Blocked by:** 02

**Status:** closed

- [x] The shared Skin lists hold all six fabrics and five disguises, each with a guard, in the same style as the Throwables.
- [x] Room: `dressGhost(id, skin)`, rejected with no Ghost or an invalid Skin. Summon and dress reject unknown fabrics or disguises. Each rejection leaves the Room unchanged.
- [x] A changed Skin shows in every Participant's snapshot.
- [x] The adapter maps `dressGhost`.
- [x] The Ghost button opens the picker. It summons, re-dresses or puts away as described, with a random Skin preselected the first time.
- [x] The Ghost component draws every fabric pattern and every disguise in the fabric's colours, matching the art prototype at about 42px wide. This includes the Rogue's narrow hood flaring over the shoulders.
- [x] Room scenario tests cover dressing, the rejections, and two Observers sharing a Skin.
