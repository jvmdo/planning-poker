# 07: The alarm

**What to build:** replace the buzz (ticket 04) with an alarm that follows the Holdout's Nudge animation (ticket 06) beat for beat, and sounds like a warning, and a bit annoying:
- **Shout:** an air horn blast for each comic word, all on one pitch, each word louder and harsher; only "VOTE!!!" is long enough to slide into tune.
- **Hop:** a smoke alarm's low-battery chirp at the top of each Card's hop.
- **Shake and punch:** mains hum with a crackle for as long as the shake, and a wrong-answer buzzer on each punch.

It restarts with the animation when a burst grows, stops when the Holdout's Vote lands or the Round is Revealed, and is louder at higher levels. Still synthesised with the Web Audio API, with no sound file, and still silent without an error if the browser won't play audio. Reduced motion doesn't change it.

See the spec in this folder: user stories 10, 21 and 24, and the client's **Alarm** bullet.

**Prototype:** branch `prototype/nudge-sound` (never merged). On any Room's URL in a dev build, `?variant=` picks the sound; a bar at the top switches variants and plays levels 1–5 or a 1→5 burst. The rounds:
1. Cartoon, kazoo choir and arcade sounds: too friendly.
2. A warning, and a bit annoying: A Alarm clock, B Siren, C System error. **C won.**
3. C's words on a cornet and trumpets: no.
4. C's words on three made-up air horns (party, ship, dying): not like the reference.
5. C's words on an air horn matched to a reference recording the human supplied (one reed at 287 Hz, a flat D4, sliding down into tune from a semitone sharp, very bright, recorded into clipping, ringing on in a room). C1 one blast per word, longer each; C3 a whole tone higher each word, liked for its steps but cartoonish.
6. C3 without the cartoon: C3a no slide on short blasts, C3b semitone steps, C3c one pitch, louder and harsher each word.

The verdict: **C3c**. The cartoon in C3 came from the reference's slide on blasts too short to settle, and from the climbing run; C3c keeps the build-up as loudness and harshness instead.

**Blocked by:** 06

**Status:** closed

- [x] The beats the alarm follows (each word, the top of each hop, each punch, the shake's length) as a pure function, with unit tests, from the same numbers the animation uses.
- [x] The alarm replaces the buzz, restarts with a burst, and stops when the Holdout's Vote lands or the Round is Revealed.
- [x] A refused or suspended audio context fails silently, as the buzz did.
- [x] Checked in a browser with bots Nudging, with and without reduced motion.
- [x] Heard on the human's desktop browser with the Nudging bots.
- [x] Signed off by the human.

## Comments

- The alarm is in `src/client/lib/nudge-sound.ts`, which replaces `buzz.ts`. The beats are `nudgeBeats` in `src/client/lib/nudge-burst.ts`, next to the hop, punch and shout timings they come from, which `holdout-nudge.ts` now reads too.
- It plays per Nudge, not once per burst: each Nudge that grows a burst restarts it with the animation, at the burst's level. That pile-up is the chaos the prototype was judged with.
- In a browser on the built app, 5 bots Nudging a Voter for 6 s: 15 horn blasts scheduled and no page errors. Nothing more was scheduled after the Voter played a Card. Same with reduced motion.
- Rendered offline at level 5, the VOTE!!! blast sits at 288 Hz, the reference's pitch.
- **For a human:** listen at levels 1 and 5 (the bar is gone, so use `npx tsx scripts/nudgers.ts <room>`), and on a phone, where the hum and buzzer's low notes may vanish.
- The human heard it on their desktop browser once they had clicked the page. Browsers only allow sound after a click or key press since the page loaded, so a Holdout whose page rejoined by itself and who hasn't touched it hears nothing. The buzz had the same gap; a "click to turn on sound" hint was offered and not built.
