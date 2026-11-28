# 01: Nudge the Holdout

**What to build:** the thinnest working Nudge, end to end.
- **Who:** when exactly one connected Voter hasn't voted, everyone else sees a "Nudge" button on the "waiting on …" line, and it's greyed out for 5 s after they use it.
- **What happens:** the Holdout's whole screen shakes for about half a second, and everyone gets a toast ("Ana sent you a Nudge!", "You Nudged Bruno", "Ana Nudged Bruno").
- **Not yet:** no build-up (every Nudge plays as level 1), no earthquake at the seat, no sound and no reduced-motion variant. Those are tickets 02–05.

Also rename the Ghost-placement "nudge" in `src/shared/ghost.ts` (for example to "shift aside"), so **Nudge** means only this feature.

See the spec in this folder: user stories 1–9, 11–13 and 16–17, and the Shared contract, Room module and Socket adapter decisions.

**Blocked by:** none

**Status:** closed

- [x] Shared: the Holdout rule as a pure function in `src/shared/`, with unit tests (nobody while two or more Voters haven't voted; nobody after everyone voted or the Reveal; Observers never count; an away Voter still counts).
- [x] Shared: the `nudge` fun event (with `level`), the `nudge(to)` command, its rejection reasons, and the cooldown and top-level constants in `src/shared/fun.ts`.
- [x] Room: `nudge(by, to)` with every rejection in the spec, a 5 s cooldown per sender, and no spending of the Reaction and Throw burst. The level is computed and sent from the start (distinct senders this Round, capped at 5), cleared in `discardRound`.
- [x] Room scenario tests with fake timers: each rejection, the cooldown boundary, independent cooldowns, Observers can Nudge, distinct-sender levels and the cap, the build-up surviving a Holdout change, and the reset on a new Round.
- [x] Socket adapter maps `nudge`, and rejections go to the sender only.
- [x] Nudge button on the waiting line, shown only when the Holdout rule names someone else who is connected, and greyed out for 5 s after use.
- [x] The Holdout's page shakes (a fixed small shake for now). Input keeps working, and the shake stops at once when their Vote lands or the Round is Revealed.
- [x] Toasts for the Holdout, the sender and everyone else, read out to screen readers.
- [x] The scenario script can leave one bot Voter as Holdout.
- [x] Checked in a browser with several Participants, including an Observer Nudging and a phone width.

## Comments

- The "waiting on …" line now stays on one line, cut short with a tooltip if it must, so the Nudge button stays in the status bar. At phone width the bar was already crowded: the line wrapped out of it, and the button ended up under the Table where it couldn't be clicked.
- A Nudge is refused with `cannot-nudge-yourself` when the sender is the target. A Holdout Nudging anyone else gets `not-the-holdout`, since that target isn't the Holdout.
- The browser's cooldown restarts when the Room sends your Nudge back, so it never ends before the Room's own.
