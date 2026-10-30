# 16: A table that fills wide screens

**What to build:** Use the free space on wide desktop screens. The main area becomes an oval table with every Voter's Card at their seat, and the Deck becomes a fanned hand underneath it. At the Reveal the Result sits in the middle of the table and the breakdown takes the hand's place, so the table never moves. The sidebar can collapse to a narrow strip, and starts collapsed on smaller screens. It must work from 1024×720 up to 1920×1080 and beyond. User stories 46–48.

**Blocked by:** none

**Status:** ready-for-agent

- [ ] The main area, under the status bar, is an oval table. Each Voter has a seat on its edge with their Card and their name; you sit at the bottom, closest to your hand, and everyone else goes round from there. The Cards look like the sidebar's, only bigger: an empty dashed slot, then face-down with the striped back, then face-up with the Vote (or "–") at the Reveal. Away Voters are faded.
- [ ] Observers don't get a seat. They're listed in a "Watching: …" line in a corner of the table area.
- [ ] While voting, the middle of the table shows how many Voters have played out of how many (for example "5/8") and who we're still waiting on, or "Everyone has played. Ready to Reveal."
- [ ] A Voter's Deck is a fanned hand along the bottom: one row of all 11 Cards, slightly rotated and dropped towards the ends. The Card you played sticks up and keeps its random colour and tilt. The Cards scale with both the width and the height of the screen, so the whole hand fits at 1024×720 and grows on bigger screens.
- [ ] An Observer sees "You're observing. The Room won't wait for your Vote." in the hand's place.
- [ ] At the Reveal the middle of the table shows the Result. The hand's place shows one vertical bar per Card played, with how many played it and the names on hover, plus "Spread X–Y hours · Ask … why" naming the Voters at each end (or "Everyone agrees" when they all played the same Card) and who didn't vote.
- [ ] The hand and the breakdown have the same height, so the table keeps exactly the same size and position at the Reveal and at New Round.
- [ ] The sidebar has a collapse button in its header. Collapsed, it shows only the logo, each Voter's small Card (no names; the name appears on hover and is announced to screen readers), and the Voter/Observer switch as two icon buttons (Voter and Observer, each with a label). An expand button brings back the full sidebar, where Leave and the theme switch stay.
- [ ] The sidebar starts collapsed when the window is narrower than 1280px, and expanded otherwise. The button then decides.
- [ ] Nothing scrolls horizontally, and nothing is cut off, at 1024×720, 1366×768 and 1920×1080, in light and dark themes, with 2 and with 10 Voters.
- [ ] The status bar (Reveal, New Round, progress) and the "Become Facilitator" banner work as they do today.

## Comments

**Prototype (2026-10-30).** Three designs were compared on wide screens: A, a table with seats, the hand underneath and the Reveal on the table; B, today's Deck grown to fill the space, plus a rail with a Round timer, nudges and reactions; C, A's table mixed with B's playful extras. C won, without the Round timer. Its playful part is ticket 17. The prototype is kept on the local `prototype/wide-layout` branch (`src/client/prototype-wide-layout/variant-c.tsx`); run it with `npm run dev` and open `/?variant=C&fake`. The prototype's seat positions (an ellipse, starting at the bottom), hand fan and fixed-height strip are good starting points; rewrite them properly rather than copying.
