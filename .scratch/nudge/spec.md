# Spec: Nudge

Status: ready-for-agent

## Problem Statement

A Round often ends with everyone staring at one name on the "waiting on …" line. Somebody has to say "Bruno, are you there?" out loud, and in a video call that's awkward, slow and easy to miss. The app already has playful ways to tease teammates (Reactions, Throws, Ghosts), but none for hurrying up the one Voter the team is waiting on.

## Solution

When exactly one Voter hasn't voted yet, they are the **Holdout**. Anyone else in the Room can **Nudge** them, in the spirit of MSN Messenger's old nudge:
- The Holdout's whole screen shakes and an original alarm plays on their device.
- Everyone else sees an earthquake at the Holdout's seat, with their Card rumbling and cracks spreading across the Table.
- Everyone gets a toast saying who Nudged whom.

The more people Nudge the same Holdout, the harder it shakes. A Nudge changes nothing in the Round.

The vocabulary is defined in the glossary (**Holdout**, **Nudge**, **Voter**, **Observer**, **Table**, **Hand**, **Throw**, **Reveal**).

## User Stories

### Who can be Nudged

1. As a Participant, I want a Voter to count as the Holdout only when they're the one Voter who hasn't voted in a Round that hasn't been Revealed, so that Nudges are kept for the moment the whole team is waiting on one person.
2. As a Voter, I want nobody to be able to Nudge me while two or more Voters are still choosing, so that I'm not rushed at the start of a Round.
3. As a Participant, I want an away Holdout to stay the Holdout but not be Nudgeable, so that the rule matches Auto Reveal and nobody Nudges an empty chair.
4. As a Holdout, I want to be unable to Nudge myself, so that the button never shows for me.

### Nudging

5. As a Participant who isn't the Holdout, I want a "Nudge" button on the "waiting on Bruno" line, so that I find it exactly when it makes sense.
6. As an Observer, with or without a Ghost, I want to Nudge too, so that watchers can join the fun.
7. As a Nudger, I want my button greyed out for about 5 seconds after I Nudge, so that I can't spam the Holdout.
8. As a Participant, I want the cooldown to be mine alone, so that someone else's Nudge never stops me from adding mine.

### Being Nudged

9. As the Holdout, I want my whole screen to shake for a moment when I'm Nudged, so that I can't miss it.
10. As the Holdout, I want a short alarm to play on my device, following what my screen does, so that I notice even if I'm looking at another window.
11. As the Holdout, I want a toast saying "Ana sent you a Nudge!", so that I know who is hurrying me.
12. As the Holdout, I want to still be able to play a Card while my screen shakes, so that a Nudge never gets in the way of voting.
13. As the Holdout, I want the shake to stop the moment I vote, so that voting feels like the answer.
14. As a Holdout with reduced motion turned on, I want a brief red flash around the screen and a vibration on my phone instead of a shake, so that I'm still Nudged without motion.

### Watching a Nudge

15. As a Participant, I want an earthquake at the Holdout's seat, with their Card rumbling and cracks spreading across the Table from it, so that I see the Nudge land and it doesn't look like a Throw's wobble.
16. As a Participant, I want a toast saying "Ana Nudged Bruno" ("You Nudged Bruno" if I sent it), so that everyone gets the joke.
17. As a screen-reader user, I want the toast read out, so that I know about a Nudge without seeing it.

### Building up

18. As a team, I want each extra person who Nudges the same Holdout to make it stronger, so that "the whole team is waiting on you" is felt.
19. As a Participant, I want only distinct people to count, so that one impatient person can't max it out alone. Their repeat Nudges still shake at the current strength.
20. As a Participant, I want it to stop growing after 5 people, so that the Holdout's screen stays usable in a big team.
21. As a Participant, I want the shake's strength and length, the Holdout's hop, punch and shout, the size of the cracks and the alarm's volume to grow together, so that the build-up reads the same everywhere.
22. As a Holdout who stops being the Holdout and becomes it again in the same Round, I want the build-up to pick up where it was, so that a teammate joining doesn't reset it.
23. As a Participant, I want the build-up to reset when a new Round starts, so that each Round starts fresh.
24. As a Holdout Nudged by several people at once, I want one stronger shake, one alarm and one toast ("Ana, Caio and 3 others sent you a Nudge!"), not a queue of them, so that a burst stays funny instead of endless.
25. As a Participant, I want everyone's toast for that burst to update in place the same way, so that toasts and screen-reader alerts don't pile up.

### More than a shake

26. As the Holdout, I want my Hand's Cards to hop, my screen to punch towards me and comic words ("psst", "hey", … "VOTE!!!") to pop out over the Table along with the shake, so that a Nudge is funny as well as hard to miss, and points at what I should do.

## Implementation Decisions

### Shared contract

- **Holdout rule:** a pure function next to the agreement helpers in `src/shared/`. Given the Participants and whether the Round is Revealed, it returns the Holdout's ID or none. The Room and the browser both use it, so the button only shows when the Room would accept the Nudge.
- **Constants:** a sender cooldown of 5 s and a top level of 5, kept next to the Reaction and Throw definitions in `src/shared/fun.ts`.
- **New fun event:** `{ kind: "nudge"; from; to; level }` joins `FunEvent`. `level` (1–5) is how many distinct people have Nudged `to` this Round, capped at 5. It goes to the whole Room on the existing fun channel, like Reactions and Throws.
- **New client-to-server command:** `nudge(to)`.

### Room module (server)

- **`nudge(by, to)`** is rejected when:
  - `to` isn't the Holdout;
  - the Holdout is away;
  - `by` is the Holdout;
  - `by` Nudged less than 5 s ago.

  Each of these has its own rejection reason in `src/shared/protocol.ts`.
- **Spending:** it has its own per-sender cooldown. It does not spend the shared Reaction and Throw burst.
- **Build-up:** the Room remembers, for each Voter, the set of people who have Nudged them this Round. An accepted Nudge adds the sender and sends the event with the capped size of that set. The memory is cleared wherever the Round is discarded (new Round, Deck change and the rest of `discardRound`'s callers), so it survives the Holdout changing hands within a Round. Someone leaving drops their cooldown, like their burst.
- **Snapshots:** they don't change, because a Nudge is a one-off event.

### Socket adapter

- Thin glue as before: map `nudge`, and send rejections to the sender only. A rejected Nudge shows no toast, because the greyed-out button already explains it.

### Client

- **Button:** a small "Nudge" button at the end of the "waiting on …" line in the status bar ([round-panel.tsx](../../src/client/round-panel.tsx)). It shows when the Holdout rule names someone other than you who is connected. It's disabled for 5 s after you Nudge, tracked in the browser and matching the Room's cooldown.
- **One Nudge on screen at a time per browser:** a Nudge that arrives while one is still playing raises it to the new level and restarts its timer instead of queueing. The names of everyone in the burst are collected for the toast.
- **Holdout's screen:** the whole page shakes (a CSS animation on the page's root). Its amplitude and length scale with the level: roughly a small 0.5 s jitter at level 1 up to a violent ~1.5 s shake at level 5. Pointer and keyboard input keep working throughout. The shake stops at once when your own Vote lands or the Round is Revealed.
- **Round the shake** ([holdout-nudge.ts](../../src/client/lib/holdout-nudge.ts)), chosen with the prototype on the `prototype/holdout-nudge` branch (ticket 06). All three grow with the level, play on top of the shake, and stop at once when your own Vote lands or the Round is Revealed:
  - **Hop:** the Hand's Cards hop up one after another, higher and in more waves at higher levels.
  - **Punch:** the whole page punches towards the Holdout from their Hand and springs back, harder and more often at higher levels, fitting as many punches as the shake's length allows, so the page is back to its size when the shake ends.
  - **Shout:** comic words pop out over the Table's area (beside the sidebar, open or closed), one more word per level: "psst", "hey", "Hey!", "HEY!!", "VOTE!!!". Each is sized for its own level. All but the last pop out at random places and pop away; the last lands in the Table's middle and stays until a little after the shake.
- **Alarm** ([nudge-sound.ts](../../src/client/lib/nudge-sound.ts)), chosen with the prototype on the `prototype/nudge-sound` branch (ticket 07); it replaced a plain buzz. Only the Holdout hears it. It follows the hop, punch and shout beat for beat, sounding like a warning, and a bit annoying:
  - **Shout:** an air horn blast for each word, on one pitch, each louder and harsher; only "VOTE!!!" slides into tune.
  - **Hop:** a smoke alarm's chirp at the top of each Card's hop.
  - **Shake and punch:** mains hum with a crackle for the shake, and a wrong-answer buzzer on each punch.

  It's synthesised with the Web Audio API, so there's no sound file and nothing copied from MSN. It's louder at higher levels, restarts with the animation when a burst grows, and stops with it. If the browser refuses to play audio, the Nudge goes ahead silently.
- **Earthquake at the seat:** on every other screen, the Holdout's seat Card rumbles (a fast side-to-side shudder, distinct from a Throw's wobble), and a few jagged cracks spread across the Table from that seat and fade. Cracks get longer and more numerous with the level. The cracks are our own simple drawing in the app's ink colour.
- **Toasts:** the existing notice toast.
  - The Holdout sees "Ana sent you a Nudge!".
  - The sender sees "You Nudged Bruno".
  - Everyone else sees "Ana Nudged Bruno".
  - A burst becomes "Ana, Caio and 3 others …", listing the first two names.
  - Each burst updates one notice in place.
- **Reduced motion:** the Holdout gets a brief red flash around the page's edge instead of the shake, hop, punch and shout, plus `navigator.vibrate` where the browser supports it. Everyone else gets the Card's earthquake replaced by a static highlight and no cracks. The alarm and toasts are unchanged.

## Testing Decisions

- **What makes a good test here:** it drives a module only through its public interface and asserts only on what callers can observe. A good Room test reads like a meeting scenario: "Ana, Bruno and Caio are Voters; Ana and Caio vote; Ana Nudges Bruno; the fun subscriber receives a level 1 Nudge; Caio Nudges Bruno; it receives level 2; Ana Nudges again after 5 s; it's still level 2."
- **The Holdout rule**, unit-tested directly:
  - nobody while two or more Voters haven't voted;
  - nobody once every Voter has voted or the Round is Revealed;
  - Observers never count;
  - an away Voter still counts.
- **The Room module**, through `nudge` and the fun subscriber (with fake timers):
  - every rejection above, each leaving the fun subscriber silent;
  - the cooldown: rejected at 4.9 s and accepted at 5 s;
  - one sender's cooldown never blocks another sender;
  - the level counts distinct senders and caps at 5;
  - the build-up survives a new Voter joining and voting within the Round, and resets on a new Round;
  - Observers can Nudge, and a Nudge doesn't spend the Reaction and Throw burst.

  Prior art: the existing Reaction, Throw and burst-limit tests in `src/server/room.test.ts`.
- **The merging of a burst** (names and level for the toast) as a small pure client module, unit-tested like `vote-marks`.
- **No socket adapter or UI tests**, as for the rest of the app. The shake, alarm, earthquake, toasts and reduced motion are checked in a browser with several Participants (the `browser-check` skill), plus bot Voters in the scenario script who leave one Voter as Holdout.

## Out of Scope

- An automatic Nudge after some time. Every Nudge is sent by a person.
- Nudging when two or more Voters haven't voted, or Nudging anyone who isn't the Holdout.
- Queueing a Nudge for an away Holdout to receive when they're back.
- A mute setting, or turning Nudges off for yourself. If wanted later, it's a per-browser switch in the sidebar like the theme.
- Nudging from the seat Card's menu or from a Ghost. The button on the waiting line is the only way.
- MSN's actual sound or artwork.

## Further Notes

- The waiting line is replaced by "Reconnecting…" or the "Facilitator left" message while either applies, so the Nudge button is hidden then too. That's accepted.
- "Nudge" was used informally in the Ghosts work for pushing a Ghost aside when every vent is taken (`src/shared/ghost.ts`, the vents ticket). Rename it there (for example to "shift aside") so **Nudge** means only this feature.
