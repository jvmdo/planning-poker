# 09: Desktop layout for the Room

**What to build:** Replace the single narrow column of the Room with a desktop layout: Participants in a left sidebar, a Round status bar across the top of the main area, and a main area that shows the Deck while voting and a Result breakdown after the Reveal. Mobile is out of scope for now.

**Blocked by:** none

**Status:** ready-for-agent

- [x] A left sidebar lists every Participant with their state (voted, not voted yet, observing), Away and Facilitator markers, and their Vote after the Reveal. The Facilitator's hand-over control lives on each row. Your name and role switch sit at the bottom.
- [x] A status bar shows whether the Round is voting or revealed, how many Voters have played, who we're waiting on, a progress bar, and the Facilitator's Reveal and New Round buttons.
- [x] While voting, a Voter sees the Deck as large Cards; an Observer sees a short explanation instead.
- [x] After the Reveal, the main area shows the Result, the range of Votes, your own Vote, and how the team voted: one bar per Card played with the names behind it, plus who didn't vote.
- [x] The join screen stays as it is.

## Comments

**Prototype (2026-10-29).** Three layouts were compared: a poker table, this sidebar layout, and a board with the Deck as a side column. The sidebar layout (variant B) won as it was. The prototype is kept on the `prototype/desktop-layout` branch (`src/client/prototype-desktop-layout/variant-b.tsx`); run it with `npm run dev` and open `/?variant=B&fake=11`.

**Implemented (2026-10-29).** All criteria are met. Notes:

- **Same components, new places:** the Participant list moved into the sidebar, `RoleToggle` sits at the bottom of the sidebar, and `RoundPanel` became the status bar. `ResultBreakdown` is new and replaces the Card hand after the Reveal, so the locked-hand state is gone.
- **Desktop only:** the sidebar is a fixed 300px column at every width, so the Room no longer fits a phone. The join screen still works on phones.
- **Removed:** the shadcn `Badge`, which nothing used any more.
- **Checked:** a browser run on a production build with four Participants: voting, the Observer view, Reveal, hand-over, then New Round.
