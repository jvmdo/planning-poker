# 15: A Card on the table for each Voter

**What to build:** Make it obvious in the sidebar who has played and who we're still waiting on. Instead of a small tick or clock before each name, every Voter has a little Card at the end of their row: face-down once they've played, an empty dashed slot until then. At the Reveal the Cards turn face-up with each Vote.

**Blocked by:** none

**Status:** ready-for-agent

- [x] A Voter who has played shows a small face-down Card, tilted, with the striped back used on the join screen; it pops in when they play.
- [x] A Voter who hasn't played yet shows an empty dashed Card-shaped slot.
- [x] After the Reveal, each Voter's Card is face-up with their Vote, or "–" if they didn't vote.
- [x] An Observer shows the eye where the Card would be.
- [x] The heading reads "Participants · N", with "played/Voters played" on the right until the Reveal.
- [x] Names, the Facilitator crown, the away mark and the hand-over button stay as they are; screen readers still hear "Voted", "Not voted yet", "Observer" and each Vote.

## Comments

**Prototype (2026-10-29).** Four designs were compared in place of the sidebar list, with made-up Participants in every state: A, a Card on the table beside each Voter; B, the list split into Waiting / Played groups; C, filled green rows for those who played; D, a grid of avatars with thinking bubbles. A won. The prototype is kept on the local `prototype/vote-status` branch (`src/client/prototype-vote-status/`); run it with `npm run dev` and open `/?variant=A&fake`.

**Implemented (2026-10-29).** All criteria are met. Notes:

- **Files:** only `participant-list.tsx` changed. `VoteStatus` draws the Card at the end of each row; the tick and clock before the name are gone, and the yellow Vote badge after the Reveal became the face-up Card.
- **Checked** in a browser on a production build, light and dark, with two Voters who played, one who hadn't and an Observer: the heading read "2/3 played", the rows showed two face-down Cards, an empty slot and the eye, and after the Reveal the Cards showed 8, 16 and "–". Screen readers get "Voted", "Not voted yet", "Observer", "Voted 8 hours" and "No Vote".
